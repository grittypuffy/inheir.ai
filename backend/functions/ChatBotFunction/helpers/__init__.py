def search_documents(query: str):
    results = config.search.search(
        search_text=query,
        # query_type="semantic",
        top=3
    )
    documents = []
    for result in results:
        documents.append(result["content"])
    return documents if documents else None


def generate_response(query, documents):
    document_string = "\n".join(documents)
    prompt = f"""
    With the following context and documents provided:
    {document_string}
    answer the query:
    {query}
    """

    # Initialize communication with the Azure OpenAI model
    try:
        # Format prompt for the model
        with get_openai_callback() as cb:
            output = config.llm.invoke(prompt)
            ret = output.content.strip()
    except Exception as e:
        raise Exception(f"Error during prompt classification: {str(e)}")

    return ret
