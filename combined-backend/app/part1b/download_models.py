import os
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'

from transformers import GPT2Tokenizer, GPT2LMHeadModel

def download_distilgpt2():
    print("Downloading DistilGPT-2 models...")
    try:
        tokenizer = GPT2Tokenizer.from_pretrained('distilgpt2')
        model = GPT2LMHeadModel.from_pretrained('distilgpt2')
        print("✅ DistilGPT-2 downloaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False

if __name__ == "__main__":
    download_distilgpt2()