import os
import asyncio
from dotenv import load_dotenv

from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm, voice
from livekit.plugins import silero, openai, cartesia

load_dotenv()

async def entrypoint(ctx: JobContext):
    # Wait for the frontend client to join the room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    print(f"Room connected: {ctx.room.name}")

    # Voice Activity Detection (Runs locally)
    vad = silero.VAD.load()

    import openai as openai_api
    groq_client = openai_api.AsyncOpenAI(
        api_key=os.environ.get("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
    )

    # Speech-to-Text -> Overriding OpenAI wrapper to hit Groq's ultra-fast whisper-large-v3 endpoint
    stt = openai.STT(
        model="whisper-large-v3",
        client=groq_client
    )
    
    # LLM -> Overriding OpenAI wrapper to hit Groq's LLaMA endpoint
    language_model = openai.LLM(
        model="llama-3.3-70b-versatile",
        client=groq_client
    )
    
    # Text-to-Speech -> Using the exact Cartesia sonic-english configurations requested by the user
    tts = cartesia.TTS(
        model="sonic-english",
        voice="6ccbfb76-1fc6-48f7-b71d-91ac6298247b"
    )

    # Initialize the Voice Agent configuration
    prompt = "You are a highly professional English communication coach running a realistic audio practice simulation. Keep your responses extremely conversational, natural, and concise (under 2 sentences). Never use markdown, lists, or emojis because your output is being streamed directly to a speech synthesizer."
    
    agent = voice.Agent(
        instructions=prompt,
    )

    # In LiveKit 1.x, we use AgentSession to manage the pipeline
    session = voice.AgentSession(
        stt=stt,
        vad=vad,
        llm=language_model,
        tts=tts,
    )

    # Start the session with the defined agent
    await session.start(agent, room=ctx.room)

    # Database sync background task
    db_session_id = None
    if "-db_" in ctx.room.name:
        try:
            db_session_id = int(ctx.room.name.split("-db_")[1])
        except ValueError:
            pass

    async def save_transcript_loop():
        if not db_session_id:
            return
            
        import sys
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if backend_dir not in sys.path:
            sys.path.append(backend_dir)
            
        try:
            from src.database import AsyncSessionLocal
            from src.models.practice import ConversationTurn
        except ImportError:
            print("Could not import DB for transcript saving.")
            return

        last_index = 0
        while ctx.room.isconnected():
            await asyncio.sleep(2)
            try:
                ctx_to_check = getattr(session, 'chat_ctx', getattr(agent, 'chat_ctx', None))
                if ctx_to_check and hasattr(ctx_to_check, 'messages'):
                    messages = ctx_to_check.messages
                    if len(messages) > last_index:
                        new_msgs = messages[last_index:]
                        last_index = len(messages)
                        
                        async with AsyncSessionLocal() as db:
                            for msg in new_msgs:
                                if msg.role in ["user", "assistant"]:
                                    text_content = ""
                                    if isinstance(msg.content, str):
                                        text_content = msg.content
                                    elif isinstance(msg.content, list):
                                        text_content = " ".join([c for c in msg.content if isinstance(c, str)])
                                    elif hasattr(msg, "text"):
                                        text_content = getattr(msg, "text")
                                    else:
                                        text_content = str(msg.content)
                                        
                                    if text_content.strip():
                                        turn = ConversationTurn(
                                            practice_session_id=db_session_id,
                                            speaker=msg.role,
                                            transcript=text_content
                                        )
                                        db.add(turn)
                            await db.commit()
            except Exception as e:
                print(f"Error syncing transcript: {e}")

    asyncio.create_task(save_transcript_loop())

    # Greeting
    await asyncio.sleep(1)
    await session.say("Hi there! I'm completely connected to the LiveKit audio stream. Whenever you're ready, let me know what communication scenario we are focusing on today.", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
