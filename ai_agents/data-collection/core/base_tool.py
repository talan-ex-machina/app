class BaseTool:
    def __init__(self, name: str = None, description: str = None):
        self.name = name
        self.description = description

    def run(self, input: dict, context: dict) -> dict:
        raise NotImplementedError("BaseTool.run must be implemented by subclasses")
