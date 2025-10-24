from typing import Optional, Annotated
from pydantic import BaseModel, Field, ConfigDict

Score = Annotated[int, Field(ge=0, le=100, description="Points 0–100")]

class AP2Part(BaseModel):
    main: Optional[Score] = Field(None, description="Main Exam")
    extra: Optional[Score] = Field(None, description="Additional Exam (optional)")

    model_config = ConfigDict(extra="forbid")

class AP2(BaseModel):
    planning: Optional[AP2Part] = Field(None, description="Planning a Software Product")
    development: Optional[AP2Part] = Field(None, description="Development and Implementation of Algorithms")
    economy: Optional[AP2Part] = Field(None, description="Economics and Social Studies")

    model_config = ConfigDict(extra="forbid")

class ML(BaseModel):
    presentation: Optional[Score] = Field(None, alias="ML1", description="Presentation and Technical Discussion")
    project: Optional[Score]      = Field(None, alias="ML2", description="Planning and Implementing a Software Project")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

class FinalExamResultInput(BaseModel):
    name: Optional[str] = Field(None, alias="Name")
    ap1: Optional[Score] = Field(None, alias="AP1", description="Setting up an IT-supported Workplace")

    ap2: Optional[AP2] = Field(None, description="Part 2 of the Final Exam")
    ml: Optional[ML]   = Field(None, description="Company Project Work")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)
