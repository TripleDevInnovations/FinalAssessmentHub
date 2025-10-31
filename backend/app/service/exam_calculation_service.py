from typing import Optional

from backend.app.model.final_exam_result_input import FinalExamResultInput, AP2Part
from backend.app.model.final_exam_result_output import FinalExamResultOutput


class ExamCalculationService:
    WEIGHTS = {
        "ap1": 0.20,
        "ap2_planning": 0.10,
        "ap2_development": 0.10,
        "ap2_economy": 0.10,
        "pw_project": 0.25,
        "pw_presentation": 0.25
    }

    def _grade_from_points(self, points: Optional[int]) -> Optional[int]:
        if points is None or points < 0 or points > 100:
            return None
        p = float(points)
        if p >= 92:
            return 1
        if p >= 81:
            return 2
        if p >= 67:
            return 3
        if p >= 50:
            return 4
        if p >= 30:
            return 5
        return 6

    def _calculate_ap2_part(self, part: Optional[AP2Part]) -> Optional[int]:
        if part is None:
            return None
        main = part.main
        extra = part.extra
        if main is None:
            return None
        if extra is None:
            return round(float(main))
        val = (2.0 / 3.0) * float(main) + (1.0 / 3.0) * float(extra)
        return round(val)

    def calculateExamResults(self, finalExamResult: FinalExamResultInput) -> FinalExamResultOutput:
        ap1_points = round(finalExamResult.ap1) if finalExamResult.ap1 is not None else None

        ap2_planning_points = self._calculate_ap2_part(
            finalExamResult.ap2.planning if (finalExamResult.ap2 is not None and finalExamResult.ap2.planning is not None) else None
        )
        ap2_development_points = self._calculate_ap2_part(
            finalExamResult.ap2.development if (finalExamResult.ap2 is not None and finalExamResult.ap2.development is not None) else None
        )
        ap2_economy_points = self._calculate_ap2_part(
            finalExamResult.ap2.economy if (finalExamResult.ap2 is not None and finalExamResult.ap2.economy is not None) else None
        )

        pw_project_points = round(finalExamResult.pw.project) if (finalExamResult.pw is not None and finalExamResult.pw.project is not None) else None
        pw_presentation_points = round(finalExamResult.pw.presentation) if (finalExamResult.pw is not None and finalExamResult.pw.presentation is not None) else None

        components = {
            "ap1": {"points": ap1_points, "grade": self._grade_from_points(ap1_points)},
            "ap2_planning": {"points": ap2_planning_points, "grade": self._grade_from_points(ap2_planning_points)},
            "ap2_development": {"points": ap2_development_points, "grade": self._grade_from_points(ap2_development_points)},
            "ap2_economy": {"points": ap2_economy_points, "grade": self._grade_from_points(ap2_economy_points)},
            "pw_project": {"points": pw_project_points, "grade": self._grade_from_points(pw_project_points)},
            "pw_presentation": {"points": pw_presentation_points, "grade": self._grade_from_points(pw_presentation_points)},
        }

        weighted_sum = 0.0
        present_weight_sum = 0.0
        for key, val in components.items():
            pts = val["points"]
            if pts is not None:
                w = self.WEIGHTS.get(key, 0.0)
                weighted_sum += w * float(pts)
                present_weight_sum += w

        if present_weight_sum > 0:
            overall_points = round(weighted_sum / present_weight_sum)
            overall_grade = self._grade_from_points(overall_points)
        else:
            overall_points = None
            overall_grade = None

        components["overall"] = {"points": overall_points, "grade": overall_grade}

        return FinalExamResultOutput.from_result_dict(components)
