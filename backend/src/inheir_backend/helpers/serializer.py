def serializer(doc):
    doc["_id"] = str(doc["_id"])
    return doc