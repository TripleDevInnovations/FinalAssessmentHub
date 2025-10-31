from typing import Optional, Annotated

from pydantic import BaseModel, Field, ConfigDict

Score = Annotated[int, Field(ge=0, le=100, description="Points 0–100")]
Grade = Annotated[int, Field(ge=1, le=6, description="Grade 1–6")]

class ComponentResult(BaseModel):
    points: Optional[Score] = Field(None, description="Points 0–100 or None if missing")
    grade: Optional[Grade] = Field(None, description="Grade 1–6 or None if missing")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class AP2Output(BaseModel):
    planning: Optional[ComponentResult] = Field(None, description="AP2 - Planning")
    development: Optional[ComponentResult] = Field(None, description="AP2 - Development")
    economy: Optional[ComponentResult] = Field(None, description="AP2 - Economy")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class PWOutput(BaseModel):
    project: Optional[ComponentResult] = Field(None, description="PW - Project")
    presentation: Optional[ComponentResult] = Field(None, description="PW - Presentation")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class FinalExamResultOutput(BaseModel):
    AP1: Optional[ComponentResult] = Field(None, description="AP1 result")
    AP2: Optional[AP2Output] = Field(None, description="AP2 results")
    PW: Optional[PWOutput] = Field(None, description="Project Work results")
    overall: Optional[ComponentResult] = Field(None, description="Overall weighted result")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    @classmethod
    def from_result_dict(cls, result_dict: dict,) -> "FinalExamResultOutput":
        def to_component(key: str):
            v = result_dict.get(key)
            if v is None:
                return None
            return ComponentResult(points=v.get("points"), grade=v.get("grade"))

        ap2 = AP2Output(
            planning=to_component("ap2_planning"),
            development=to_component("ap2_development"),
            economy=to_component("ap2_economy")
        )

        pw = PWOutput(
            presentation=to_component("pw_presentation"),
            project=to_component("pw_project")
        )

        return cls(
            AP1=to_component("ap1"),
            AP2=ap2,
            PW=pw,
            overall=to_component("overall")
        )
