from typing import Tuple, Union


class XY:
    """Represent x,y coords with properly overloaded operations."""

    def __init__(self, x: float = 0, y: float = 0) -> None:
        self.x = x
        self.y = y

    def __mul__(self, factor: Union[float, "XY"]) -> "XY":
        if isinstance(factor, XY):
            return XY(self.x * factor.x, self.y * factor.y)
        return XY(self.x * factor, self.y * factor)

    def __rmul__(self, factor: Union[float, "XY"]) -> "XY":
        if isinstance(factor, XY):
            return XY(self.x * factor.x, self.y * factor.y)
        return XY(self.x * factor, self.y * factor)

    def __add__(self, other: "XY") -> "XY":
        return XY(self.x + other.x, self.y + other.y)

    def __sub__(self, other: "XY") -> "XY":
        return XY(self.x - other.x, self.y - other.y)

    def __repr__(self):
        return f"XY: {self.x}/{self.y}"

    def tuple(self) -> Tuple[float, float]:
        return self.x, self.y
