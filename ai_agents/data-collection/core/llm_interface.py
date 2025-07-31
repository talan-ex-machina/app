import google.generativeai as genai
from typing import List, Optional, Any, Dict
import time
import logging
from requests.exceptions import RequestException
from google.api_core.exceptions import GoogleAPIError, RetryError
import socket

logger = logging.getLogger('gemini_llm')

class GeminiLLM:
    def __init__(self, api_key: str, max_retries: int = 3, initial_delay: float = 1.0):
        """
        Initialize the Gemini LLM client with retry configuration.
        
        Args:
            api_key: Google AI API key
            max_retries: Maximum number of retry attempts
            initial_delay: Initial delay between retries in seconds (will be doubled after each retry)
        """
        self.max_retries = max_retries
        self.initial_delay = initial_delay
        
        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash")
            logger.info("Successfully initialized Gemini LLM client")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini LLM client: {str(e)}")
            raise

    def _is_retryable_error(self, error: Exception) -> bool:
        """Check if the error is retryable."""
        if isinstance(error, (socket.gaierror, ConnectionError, TimeoutError)):
            return True
        if isinstance(error, RequestException):
            return True
        if isinstance(error, GoogleAPIError):
            return True
        if isinstance(error, RetryError):
            return True
        return False

    def generate_response(
        self, 
        facts: List[Dict[str, Any]], 
        prompt: Optional[str] = None,
        **generation_kwargs
    ) -> str:
        """
        Generate a response using the Gemini model with retry logic.
        
        Args:
            facts: List of facts to include in the prompt
            prompt: Custom prompt (optional)
            **generation_kwargs: Additional generation parameters
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If all retry attempts fail or a non-retryable error occurs
        """
        prompt = prompt or "Analyze the following data and provide a response:\n"
        formatted_data = "\n".join([str(item) for item in facts])
        full_prompt = prompt + formatted_data
        
        # Truncate very long prompts to avoid token limits
        if len(full_prompt) > 10000:  # Rough estimate, adjust based on model limits
            full_prompt = full_prompt[:10000] + "\n[Content truncated due to length]"
        
        last_error = None
        delay = self.initial_delay
        
        for attempt in range(self.max_retries + 1):
            try:
                logger.debug(f"Generating response (attempt {attempt + 1}/{self.max_retries + 1})")
                response = self.model.generate_content(
                    full_prompt,
                    **generation_kwargs
                )
                return response.text
                
            except Exception as e:
                last_error = e
                if not self._is_retryable_error(e) or attempt == self.max_retries - 1:
                    break
                    
                logger.warning(
                    f"Attempt {attempt + 1} failed with error: {str(e)}. "
                    f"Retrying in {delay:.1f} seconds..."
                )
                time.sleep(delay)
                delay *= 2  # Exponential backoff
        
        # If we get here, all retries failed
        error_msg = (
            f"Failed to generate response after {self.max_retries + 1} attempts. "
            f"Last error: {str(last_error)}"
        )
        logger.error(error_msg)
        raise Exception(error_msg) from last_error
