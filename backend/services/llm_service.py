import logging
import httpx
import os
from utils.config import settings

logger = logging.getLogger("alphaai.services.llm")

class LLMService:
    @staticmethod
    async def complete(prompt: str, system_prompt: str = "You are AlphaAI, an advanced stock market AI assistant.") -> str:
        """
        Perform a LLM chat completion using Groq with model and platform fallbacks.
        """
        # Read GROQ_API_KEY from environment or settings
        api_key = os.getenv("GROQ_API_KEY")
        
        if not api_key:
            # Platform fallback: Google Gemini
            gemini_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "google_api_key", None)
            if gemini_key:
                logger.info("GROQ_API_KEY not configured. Falling back to Gemini API.")
                return await LLMService._complete_gemini(prompt, system_prompt, gemini_key)
            
            logger.warning("No AI API keys configured. Returning simulated AI response.")
            return "AlphaAI AI engine is currently unconfigured. Please check backend/.env configuration."

        # Groq API Headers
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Models to try sequentially on failure
        models = ["llama-3.1-70b-versatile", "llama3-70b-8192", "mixtral-8x7b-32768"]
        
        for model in models:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 800
            }
            
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        json=payload,
                        headers=headers
                    )
                    if response.status_code == 200:
                        result = response.json()
                        content = result["choices"][0]["message"]["content"]
                        logger.info(f"Groq API call succeeded using model {model}.")
                        return content
                    else:
                        logger.warning(f"Groq model {model} returned status {response.status_code}: {response.text}")
            except Exception as e:
                logger.error(f"Failed calling Groq model {model}: {e}")
                
        # If all Groq models fail, attempt Gemini platform fallback
        gemini_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "google_api_key", None)
        if gemini_key:
            logger.info("All Groq models failed. Initiating Gemini platform fallback.")
            return await LLMService._complete_gemini(prompt, system_prompt, gemini_key)
            
        return "AlphaAI: Generation failed. All Groq models are currently busy or unconfigured."

    @staticmethod
    async def _complete_gemini(prompt: str, system_prompt: str, api_key: str) -> str:
        """
        Fallback generator calling the Gemini API directly.
        """
        headers = {"Content-Type": "application/json"}
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        full_prompt = f"{system_prompt}\n\nUser Question:\n{prompt}"
        payload = {
            "contents": [
                {"parts": [{"text": full_prompt}]}
            ]
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    result = response.json()
                    content = result["candidates"][0]["content"]["parts"][0]["text"]
                    logger.info("Gemini Pro fallback completed successfully.")
                    return content
                else:
                    logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Failed calling Gemini API fallback: {e}")
            
        return "AlphaAI: Generation failed. All generative AI services are currently unavailable."
