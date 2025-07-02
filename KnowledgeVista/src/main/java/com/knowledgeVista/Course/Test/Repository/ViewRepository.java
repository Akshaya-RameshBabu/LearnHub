package com.knowledgeVista.Course.Test.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Course.Test.MuserTestActivity;

import jakarta.transaction.Transactional;

@Repository
public interface ViewRepository extends JpaRepository<MuserTestActivity, Long> {

	@Modifying
	@Transactional
	@Query(value = """
			        CREATE OR REPLACE VIEW combined_test_activity AS
			SELECT
			    a.activity_id AS activityId,
			    a.user_id AS userId,
			    u.email AS email,
			    'TEST' AS type,  -- Type is Test for CourseTest
			    c.course_name AS courseName,
			    c.course_id AS courseId,
			    t.test_name AS testName,
			    a.test_id AS testId,
			    a.test_date AS testDate,
			    a.nth_attempt AS nthAttempt,
			    a.percentage AS percentage,
			    CASE
			        WHEN a.percentage >= t.pass_percentage THEN 'PASS'
			        ELSE 'FAIL'
			    END AS status  -- Status logic added
			FROM muser_test_activity a
			JOIN course_test t ON a.test_id = t.test_id
			JOIN course_detail c ON t.course_id = c.course_id
			JOIN muser u ON a.user_id = u.user_id

			UNION ALL

			SELECT
			    m.mactivity_id AS activityId,
			    m.user_id AS userId,
			    u.email AS email,
			    'MTEST' AS type,  -- Type is Module Test for ModuleTest
			    cd.course_name AS courseName,
			    cd.course_id AS courseId,
			    mt.mtest_name AS testName,
			    m.mtest_id AS testId,
			    m.test_date AS testDate,
			    m.nth_attempt AS nthAttempt,
			    m.percentage AS percentage,
			    CASE
			        WHEN m.percentage >= mt.mpass_percentage THEN 'PASS'
			        ELSE 'FAIL'
			    END AS status
			FROM module_test_activity m
			JOIN module_test mt ON m.mtest_id = mt.mtest_id
			JOIN course_detail cd ON mt.course_id = cd.course_id
			JOIN muser u ON m.user_id = u.user_id;
			        """, nativeQuery = true)
	void createCombinedView();

	@Query(value = """
			SELECT
			    COALESCE(ta.courseName, cd.course_name, mt.mtest_name) AS courseName,
			    COALESCE(ta.courseId, cd.course_id, mt.mtest_id) AS courseId,
			    COALESCE(ta.testName, ct.test_name, mt.mtest_name) AS testName,
			    COALESCE(ta.testId, ct.test_id, mt.mtest_id) AS testId,
			    COALESCE(ta.testDate, CURRENT_DATE) AS testDate,
			    COALESCE(ta.nthAttempt, 0) AS nthAttempt,
			    COALESCE(ta.percentage, 0.0) AS percentage,
			    COALESCE(ta.status, 'NOT ATTEMPTED') AS status,
			    COALESCE(ta.type, CASE WHEN ct.test_id IS NOT NULL THEN 'TEST' ELSE 'MTEST' END) AS type
			FROM
			    (SELECT * FROM combined_test_activity WHERE email = :email) ta
			FULL OUTER JOIN course_test ct ON ta.testId = ct.test_id AND ta.type = 'TEST'
			FULL OUTER JOIN module_test mt ON ta.testId = mt.mtest_id AND ta.type = 'MTEST'
			LEFT JOIN course_detail cd ON ct.course_id = cd.course_id OR mt.course_id = cd.course_id
			WHERE
			    (ct.test_id IN (:testIds) OR mt.mtest_id IN (:mtestIds))
			""", countQuery = """
			SELECT COUNT(*)
			FROM (
			    SELECT ta.testId
			    FROM
			        (SELECT * FROM combined_test_activity WHERE email = :email) ta
			    FULL OUTER JOIN course_test ct ON ta.testId = ct.test_id AND ta.type = 'TEST'
			    FULL OUTER JOIN module_test mt ON ta.testId = mt.mtest_id AND ta.type = 'MTEST'
			    WHERE (ct.test_id IN (:testIds) OR mt.mtest_id IN (:mtestIds))
			) count_table
			""", nativeQuery = true)
	Page<Object[]> getTestHistory(@Param("email") String email, @Param("testIds") List<Long> testIds,
			@Param("mtestIds") List<Long> mtestIds, Pageable pageable);

}
