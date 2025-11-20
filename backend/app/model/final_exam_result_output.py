from typing import Optional, Annotated, List
from pydantic import BaseModel, Field, ConfigDict

Score = Annotated[int, Field(ge=0, le=100, description="Points 0–100")]
Grade = Annotated[int, Field(ge=1, le=6, description="Grade 1–6")]

class ComponentResult(BaseModel):
    points: Optional[Score] = Field(None, description="Points 0–100 or None if missing")
    grade: Optional[Grade] = Field(None, description="Grade 1–6 or None if missing")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

class PWOutput(BaseModel):
    project: Optional[ComponentResult] = Field(None, description="PW - Project")
    presentation: Optional[ComponentResult] = Field(None, description="PW - Presentation")
    overall: Optional[ComponentResult] = Field(None, description="PW Overall weighted result")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

class AP2Output(BaseModel):
    planning: Optional[ComponentResult] = Field(None, description="AP2 - Planning")
    development: Optional[ComponentResult] = Field(None, description="AP2 - Development")
    economy: Optional[ComponentResult] = Field(None, description="AP2 - Economy")
    pw: Optional[PWOutput] = Field(None, description="Project Work results")
    overall: Optional[ComponentResult] = Field(None, description="AP2 - Overall")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

class ExamStatus(BaseModel):
    passed: bool = Field(..., description="Shows if you passed the exam")
    reasons: List[str] = Field(
        default_factory=list,
        description="A list of reason codes if the exam was failed. Empty if passed."
    )
    model_config = ConfigDict(extra="forbid")

class FinalExamResultOutput(BaseModel):
    AP1: Optional[ComponentResult] = Field(None, description="AP1 result")
    AP2: Optional[AP2Output] = Field(None, description="AP2 results")
    Overall: Optional[ComponentResult] = Field(None, description="Overall weighted result")
    Status: ExamStatus = Field(..., description="The final status of the exam")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    @classmethod
    def from_result_dict(cls, result_dict: dict) -> "FinalExamResultOutput":
        def to_component(key: str):
            v = result_dict.get(key)
            if v is None:
                return None
            return ComponentResult(points=v.get("points"), grade=v.get("grade"))

        pw = PWOutput(
            project=to_component("ap2_pw_project"),
            presentation=to_component("ap2_pw_presentation"),
            overall=to_component("ap2_pw_overall")
        )

        ap2 = AP2Output(
            planning=to_component("ap2_planning"),
            development=to_component("ap2_development"),
            economy=to_component("ap2_economy"),
            pw=pw,
            overall=to_component("ap2_overall")
        )

        status = ExamStatus(
            passed=result_dict.get("Passed", False),
            reasons=result_dict.get("FailureReasons", [])
        )

        return cls(
            AP1=to_component("ap1"),
            AP2=ap2,
            Overall=to_component("Overall"),
            Status=status
        )
