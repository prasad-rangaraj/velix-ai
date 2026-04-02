import asyncio
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask
from pipecat.pipeline.runner import PipelineRunner
from pipecat.services.gemini_multimodal_live.gemini import GeminiMultimodalLiveService

async def run_pipecat_session(webrtc_transport):
    runner = PipelineRunner()
    
    gemini = GeminiMultimodalLiveService(
        model="models/gemini-2.0-flash-exp"
    )

    pipeline = Pipeline([
        webrtc_transport.input(),
        gemini,
        webrtc_transport.output(),
    ])
    
    task = PipelineTask(pipeline)
    
    await runner.run(task)
