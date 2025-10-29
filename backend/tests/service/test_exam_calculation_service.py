import unittest

from backend.app.model.final_exam_result_input import AP2, AP2Part, FinalExamResultInput, ML
from backend.app.service.exam_calculation_service import ExamCalculationService


class TestExamCalculationService(unittest.TestCase):

    def setUp(self):
        self.service = ExamCalculationService()

    def test_grade_from_points(self):
        self.assertIsNone(self.service._grade_from_points(None))
        self.assertEqual(self.service._grade_from_points(100), 1)
        self.assertEqual(self.service._grade_from_points(92), 1)
        self.assertEqual(self.service._grade_from_points(91), 2)
        self.assertEqual(self.service._grade_from_points(81), 2)
        self.assertEqual(self.service._grade_from_points(80), 3)
        self.assertEqual(self.service._grade_from_points(67), 3)
        self.assertEqual(self.service._grade_from_points(66), 4)
        self.assertEqual(self.service._grade_from_points(50), 4)
        self.assertEqual(self.service._grade_from_points(49), 5)
        self.assertEqual(self.service._grade_from_points(30), 5)
        self.assertEqual(self.service._grade_from_points(29), 6)
        self.assertEqual(self.service._grade_from_points(0), 6)

    def test_calculate_ap2_part(self):
        self.assertIsNone(self.service._calculate_ap2_part(None))
        self.assertIsNone(self.service._calculate_ap2_part(AP2Part(main=None, extra=None)))
        self.assertIsNone(self.service._calculate_ap2_part(AP2Part(main=None, extra=90)))

        self.assertEqual(self.service._calculate_ap2_part(AP2Part(main=88, extra=None)), 88)

        self.assertEqual(self.service._calculate_ap2_part(AP2Part(main=80, extra=70)), 77)
        self.assertEqual(self.service._calculate_ap2_part(AP2Part(main=55, extra=56)), 55)

    def test_calculate_exam_results_full_input(self):
        full_input = FinalExamResultInput(
            AP1=90,
            ap2=AP2(
                planning=AP2Part(main=80, extra=70),
                development=AP2Part(main=85, extra=None),
                economy=AP2Part(main=95, extra=95)
            ),
            ml=ML(ML1=92, ML2=88)
        )

        result = self.service.calculateExamResults(full_input)

        self.assertEqual(result.AP1.points, 90)
        self.assertEqual(result.AP1.grade, 2)

        self.assertEqual(result.AP2.planning.points, 77)
        self.assertEqual(result.AP2.planning.grade, 3)

        self.assertEqual(result.AP2.development.points, 85)
        self.assertEqual(result.AP2.development.grade, 2)

        self.assertEqual(result.AP2.economy.points, 95)
        self.assertEqual(result.AP2.economy.grade, 1)

        self.assertEqual(result.ML.project.points, 88)
        self.assertEqual(result.ML.project.grade, 2)

        self.assertEqual(result.ML.presentation.points, 92)
        self.assertEqual(result.ML.presentation.grade, 1)

        self.assertEqual(result.overall.points, 89)
        self.assertEqual(result.overall.grade, 2)

    def test_calculate_exam_results_partial_input(self):
        partial_input = FinalExamResultInput(
            AP1=80,
            ap2=None,
            ml=ML(ML1=95, ML2=90)
        )

        result = self.service.calculateExamResults(partial_input)

        self.assertEqual(result.AP1.points, 80)
        self.assertEqual(result.AP1.grade, 3)

        self.assertEqual(result.ML.project.points, 90)
        self.assertEqual(result.ML.project.grade, 2)

        self.assertEqual(result.ML.presentation.points, 95)
        self.assertEqual(result.ML.presentation.grade, 1)

        self.assertIsNone(result.AP2.planning.grade)
        self.assertIsNone(result.AP2.planning.points)
        self.assertIsNone(result.AP2.development.grade)
        self.assertIsNone(result.AP2.development.points)
        self.assertIsNone(result.AP2.economy.grade)
        self.assertIsNone(result.AP2.economy.points)

        self.assertEqual(result.overall.points, 89)
        self.assertEqual(result.overall.grade, 2)

    def test_calculate_exam_results_empty_input(self):
        empty_input = FinalExamResultInput(ap1=None, ap2=None, ml=None)

        result = self.service.calculateExamResults(empty_input)

        self.assertIsNone(result.AP1.grade)
        self.assertIsNone(result.AP1.points)
        self.assertIsNone(result.AP2.planning.grade)
        self.assertIsNone(result.AP2.planning.points)
        self.assertIsNone(result.AP2.development.grade)
        self.assertIsNone(result.AP2.development.points)
        self.assertIsNone(result.AP2.economy.grade)
        self.assertIsNone(result.AP2.economy.points)
        self.assertIsNone(result.ML.presentation.grade)
        self.assertIsNone(result.ML.presentation.points)
        self.assertIsNone(result.ML.project.grade)
        self.assertIsNone(result.ML.project.points)
        self.assertIsNone(result.overall.grade)
        self.assertIsNone(result.overall.points)
