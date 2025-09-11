package com.knowledgeVista.Course.Test.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.Course.Test.CourseTest;

@Repository
public interface TestRepository extends JpaRepository<CourseTest, Long> {
	// List<CourseTest> findByCourseDetail(CourseDetail courseDetail);
	Optional<CourseTest> findByCourseDetail(CourseDetail courseDetail);

}
