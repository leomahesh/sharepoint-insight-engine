import langchain.chains
print(dir(langchain.chains))
try:
    from langchain.chains import RetrievalQA
    print("Imported RetrievalQA from chains")
except ImportError as e:
    print(f"Failed direct import: {e}")

try:
    import langchain.chains.retrieval_qa.base
    print("Found retrieval_qa.base")
except ImportError as e:
    print(f"Failed base import: {e}")
