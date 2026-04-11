def embed(text):
    vec = [ord(c) for c in text[:50]]

    while len(vec) < 50:
        vec.append(0)

    return vec