from typing import Optional
from backend.app.model.final_exam_result_input import FinalExamResultInput, AP2Part
from backend.app.model.final_exam_result_output import FinalExamResultOutput


class ExamCalculationService:
    WEIGHTS = {
        "ap1": 0.20,
        "ap2_planning": 0.10,
        "ap2_development": 0.10,
        "ap2_economy": 0.10,
        "ap2_pw_overall": 0.50
    }

    def _grade_from_points(self, points: Optional[int]) -> Optional[int]:
        if points is None or points < 0 or points > 100:
            return None
        p = float(points)
        if p >= 92: return 1
        if p >= 81: return 2
        if p >= 67: return 3
        if p >= 50: return 4
        if p >= 30: return 5
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
            finalExamResult.ap2.planning if (finalExamResult.ap2 and finalExamResult.ap2.planning) else None)
        ap2_development_points = self._calculate_ap2_part(
            finalExamResult.ap2.development if (finalExamResult.ap2 and finalExamResult.ap2.development) else None)
        ap2_economy_points = self._calculate_ap2_part(
            finalExamResult.ap2.economy if (finalExamResult.ap2 and finalExamResult.ap2.economy) else None)

        ap2_pw_project_points = round(finalExamResult.ap2.pw.project) if (
                    finalExamResult.ap2 and finalExamResult.ap2.pw and finalExamResult.ap2.pw.project is not None) else None
        ap2_pw_presentation_points = round(finalExamResult.ap2.pw.presentation) if (
                    finalExamResult.ap2 and finalExamResult.ap2.pw and finalExamResult.ap2.pw.presentation is not None) else None

        ap2_pw_overall_points = None
        if ap2_pw_project_points is not None and ap2_pw_presentation_points is not None:
            ap2_pw_overall_points = round(0.5 * ap2_pw_project_points + 0.5 * ap2_pw_presentation_points)
        elif ap2_pw_project_points is not None:
            ap2_pw_overall_points = ap2_pw_project_points
        elif ap2_pw_presentation_points is not None:
            ap2_pw_overall_points = ap2_pw_presentation_points

        components = {
            "ap1": {"points": ap1_points, "grade": self._grade_from_points(ap1_points)},
            "ap2_planning": {"points": ap2_planning_points, "grade": self._grade_from_points(ap2_planning_points)},
            "ap2_development": {"points": ap2_development_points,
                                "grade": self._grade_from_points(ap2_development_points)},
            "ap2_economy": {"points": ap2_economy_points, "grade": self._grade_from_points(ap2_economy_points)},
            "ap2_pw_project": {"points": ap2_pw_project_points, "grade": self._grade_from_points(ap2_pw_project_points)},
            "ap2_pw_presentation": {"points": ap2_pw_presentation_points,
                                "grade": self._grade_from_points(ap2_pw_presentation_points)},
            "ap2_pw_overall": {"points": ap2_pw_overall_points, "grade": self._grade_from_points(ap2_pw_overall_points)},
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

        components["Overall"] = {"points": overall_points, "grade": overall_grade}

        fail_cond1 = any(p is not None and p < 30 for p in [
            ap1_points, ap2_planning_points, ap2_development_points, ap2_economy_points, ap2_pw_overall_points
        ])

        fail_cond2 = sum(1 for p in [
            ap2_planning_points, ap2_development_points, ap2_economy_points, ap2_pw_overall_points
        ] if p is not None and p < 50) > 1

        fail_cond3 = overall_points is not None and overall_points < 50

        passed = not (fail_cond1 or fail_cond2 or fail_cond3)

        components["Passed"] = passed

        return FinalExamResultOutput.from_result_dict(components)
