# Testing and GitHub Workflows Guide

This document explains the **Unit Testing**, **Integration Testing**, and **GitHub Workflows** implemented in this project.

---

## Table of Contents

1. [Unit Testing](#unit-testing)
2. [Integration Testing](#integration-testing)
3. [GitHub Workflows (CI/CD)](#github-workflows-cicd)

---

## Unit Testing

Unit tests verify **individual components in isolation** using mock dependencies. This project uses **JUnit 5** and **Mockito**.

### Key Concepts

| Annotation | Purpose |
|------------|---------|
| `@ExtendWith(MockitoExtension.class)` | Enables Mockito support |
| `@Mock` | Creates a mock object |
| `@InjectMocks` | Injects mocks into the class under test |
| `@BeforeEach` | Runs setup before each test |
| `@Test` | Marks a test method |
| `@DisplayName` | Provides readable test names |
| `@Nested` | Groups related tests together |

### Example: UserServiceTest

**Location:** [src/test/java/com/example/school/service/UserServiceTest.java](../src/test/java/com/example/school/service/UserServiceTest.java)

```java
@ExtendWith(MockitoExtension.class)  // 1. Enable Mockito
class UserServiceTest {

    @Mock
    private UserRepository userRepository;  // 2. Mock the dependency

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;  // 3. Inject mocks into service

    private User student;

    @BeforeEach
    void setUp() {
        // 4. Create test data
        student = new User();
        student.setId(2L);
        student.setUsername("student1");
        student.setRole(Role.STUDENT);
    }

    @Nested
    @DisplayName("findById")
    class FindById {
        
        @Test
        @DisplayName("returns user when found")
        void returnsUserWhenFound() {
            // 5. Define mock behavior
            when(userRepository.findById(2L)).thenReturn(Optional.of(student));
            
            // 6. Call the method
            Optional<User> result = userService.findById(2L);
            
            // 7. Assert the result
            assertThat(result).contains(student);
        }

        @Test
        @DisplayName("returns empty when not found")
        void returnsEmptyWhenNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());
            assertThat(userService.findById(999L)).isEmpty();
        }
    }
}
```

### How It Works

1. **`@Mock`** creates fake versions of `UserRepository` and `PasswordEncoder`
2. **`@InjectMocks`** automatically injects these mocks into `UserService`
3. **`when(...).thenReturn(...)`** defines what the mock should return
4. **`assertThat(...)`** (AssertJ) verifies the expected outcome
5. **`verify(...)`** confirms a method was called on a mock

### Other Unit Test Files

| File | What It Tests |
|------|---------------|
| [ClassServiceTest.java](../src/test/java/com/example/school/service/ClassServiceTest.java) | Class CRUD operations, enrollments |
| [SchoolUserDetailsServiceTest.java](../src/test/java/com/example/school/security/SchoolUserDetailsServiceTest.java) | User authentication loading |

---

## Integration Testing

Integration tests verify **multiple components working together** with a real Spring context. They test HTTP endpoints, security, and database interactions.

### Key Concepts

| Annotation | Purpose |
|------------|---------|
| `@SpringBootTest` | Loads the full Spring application context |
| `@ActiveProfiles("test")` | Uses test configuration |
| `@Sql` | Loads SQL scripts before tests |
| `@WithUserDetails` | Simulates authenticated user |
| `MockMvc` | Simulates HTTP requests |

### Example: StudentControllerIntegrationTest

**Location:** [src/test/java/com/example/school/web/StudentControllerIntegrationTest.java](../src/test/java/com/example/school/web/StudentControllerIntegrationTest.java)

```java
@SpringBootTest  // 1. Load full Spring context
@ActiveProfiles("test")  // 2. Use test profile (H2 database)
@Sql(scripts = "/test-users.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)  // 3. Load test data
class StudentControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        // 4. Setup MockMvc with Spring Security
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("GET /api/students unauthenticated returns 401")
    void listStudents_unauthorized_returns401() throws Exception {
        // 5. Test without authentication
        mockMvc.perform(get("/api/students"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/students as teacher returns 200")
    @WithUserDetails(value = "test_teacher", 
                     userDetailsServiceBeanName = "schoolUserDetailsService")  // 6. Simulate logged-in teacher
    void listStudents_asTeacher_returns200() throws Exception {
        mockMvc.perform(get("/api/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());  // 7. Verify JSON response
    }

    @Test
    @DisplayName("POST /api/students as teacher creates student")
    @WithUserDetails(value = "test_teacher", 
                     userDetailsServiceBeanName = "schoolUserDetailsService")
    void createStudent_asTeacher_createsStudent() throws Exception {
        String body = """
                {"username":"newstudent1","password":"pass123","name":"New Student"}
                """;
        
        mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())  // 8. Expect 201 Created
                .andExpect(jsonPath("$.username").value("newstudent1"));
    }
}
```

### How It Works

1. **`@SpringBootTest`** starts the entire application (controllers, services, repositories)
2. **`@ActiveProfiles("test")`** uses `application-test.yaml` with H2 in-memory database
3. **`@Sql`** populates test users before each test
4. **`MockMvc`** sends HTTP requests without a real server
5. **`@WithUserDetails`** simulates an authenticated session
6. **`jsonPath("$.field")`** validates JSON response fields

### Test Configuration

**Location:** [src/test/resources/application-test.yaml](../src/test/resources/application-test.yaml)

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb  # In-memory database
  jpa:
    hibernate:
      ddl-auto: create-drop  # Fresh schema each test
```

### Other Integration Test Files

| File | What It Tests |
|------|---------------|
| [AuthControllerIntegrationTest.java](../src/test/java/com/example/school/web/AuthControllerIntegrationTest.java) | Login, registration, authentication |

---

## GitHub Workflows (CI/CD)

GitHub Actions automatically **builds and tests** the project on every push and pull request.

### Workflow File

**Location:** [.github/workflows/ci.yml](../.github/workflows/ci.yml)

```yaml
name: CI

# 1. When to run
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest  # 2. Linux runner
    
    steps:
      # 3. Checkout code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 4. Setup Java 17
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven  # Cache dependencies

      # 5. Fix Maven wrapper (Windows line endings)
      - name: Fix Maven wrapper for Linux
        run: |
          sed -i 's/\r$//' mvnw
          chmod +x mvnw

      # 6. Build and run ALL tests
      - name: Build and run tests
        run: ./mvnw -B verify
```

### How It Works

| Step | What Happens |
|------|--------------|
| **Trigger** | Runs on push to `main`/`master` or any PR targeting those branches |
| **Checkout** | Downloads your code to the runner |
| **Setup JDK** | Installs Java 17 (Temurin distribution) |
| **Maven Cache** | Caches `~/.m2` to speed up builds |
| **Fix mvnw** | Converts Windows line endings, makes executable |
| **Verify** | Runs `mvn verify` which compiles, tests, and packages |

### Workflow Diagram

```
┌─────────────────┐
│  Push to main   │
│  or PR created  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Checkout Code   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Setup JDK 17    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fix Maven       │
│ Wrapper         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ mvn verify      │
│ (compile, test) │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ PASS  │ │ FAIL  │
│  ✓    │ │  ✗    │
└───────┘ └───────┘
```

### Branch Protection Integration

When branch protection rules require **"Status checks to pass"**, GitHub will:

1. Block merging if tests fail
2. Show ✓ or ✗ next to the PR
3. Require the `build-and-test` job to pass

---

## Running Tests Locally

```bash
# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=UserServiceTest

# Run with verbose output
./mvnw test -X

# Build and verify (same as CI)
./mvnw verify
```

---

## Summary

| Type | Purpose | Tools | Speed |
|------|---------|-------|-------|
| **Unit Tests** | Test one class in isolation | Mockito, JUnit 5 | Fast (ms) |
| **Integration Tests** | Test components together | SpringBootTest, MockMvc | Slower (seconds) |
| **CI Workflow** | Automated testing on every change | GitHub Actions | ~2-3 min |

This testing strategy ensures code quality through:
- ✅ Unit tests catch logic errors early
- ✅ Integration tests verify API behavior
- ✅ CI prevents broken code from being merged
