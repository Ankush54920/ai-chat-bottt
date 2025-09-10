import { EnhancedStudyRenderer } from "./EnhancedStudyRenderer";

// Demo component to test the new Study Mode renderer
export const StudyModeDemo = () => {
  const sampleMathProblem = `Let's solve this quadratic equation step by step.

**Problem:** Solve for x: $x^2 + 5x + 6 = 0$

**Solution:**

Step 1: Identify the coefficients
- a = 1 (coefficient of x²)
- b = 5 (coefficient of x)  
- c = 6 (constant term)

Step 2: Use the quadratic formula
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

Step 3: Substitute the values
$$x = \\frac{-5 \\pm \\sqrt{5^2 - 4(1)(6)}}{2(1)}$$

Step 4: Simplify under the square root
$$x = \\frac{-5 \\pm \\sqrt{25 - 24}}{2}$$
$$x = \\frac{-5 \\pm \\sqrt{1}}{2}$$

Step 5: Calculate the two solutions
$$x = \\frac{-5 + 1}{2} = \\frac{-4}{2} = -2$$
$$x = \\frac{-5 - 1}{2} = \\frac{-6}{2} = -3$$

**Answer:** The solutions are x = -2 and x = -3.

**Verification:**
Let's check x = -2: $(-2)^2 + 5(-2) + 6 = 4 - 10 + 6 = 0$ ✓
Let's check x = -3: $(-3)^2 + 5(-3) + 6 = 9 - 15 + 6 = 0$ ✓

Both solutions are correct!`;

  const samplePhysicsProblem = `**Physics Problem: Projectile Motion**

A ball is thrown horizontally from a height of 20m with an initial velocity of 15 m/s. Find:
1. Time to hit the ground
2. Horizontal distance traveled

**Given:**
- Initial height: $h_0 = 20$ m
- Initial horizontal velocity: $v_{x0} = 15$ m/s
- Initial vertical velocity: $v_{y0} = 0$ m/s (thrown horizontally)
- Acceleration due to gravity: $g = 9.8$ m/s²

**Solution:**

**Part 1: Time to hit the ground**

Using the vertical motion equation:
$$h = h_0 + v_{y0}t - \\frac{1}{2}gt^2$$

When the ball hits the ground, h = 0:
$$0 = 20 + 0 \\cdot t - \\frac{1}{2}(9.8)t^2$$
$$0 = 20 - 4.9t^2$$
$$4.9t^2 = 20$$
$$t^2 = \\frac{20}{4.9} = 4.08$$
$$t = \\sqrt{4.08} = 2.02 \\text{ seconds}$$

**Part 2: Horizontal distance**

Using the horizontal motion equation:
$$x = v_{x0} \\cdot t$$
$$x = 15 \\times 2.02 = 30.3 \\text{ meters}$$

**Answer:**
- Time to hit the ground: 2.02 seconds
- Horizontal distance: 30.3 meters

This demonstrates that horizontal and vertical motions are independent in projectile motion!`;

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Study Mode Demo</h2>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Math Problem Example:</h3>
        <EnhancedStudyRenderer 
          message={sampleMathProblem}
          timestamp={new Date()}
          mode="Study Mode"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Physics Problem Example:</h3>
        <EnhancedStudyRenderer 
          message={samplePhysicsProblem}
          timestamp={new Date()}
          mode="Study Mode"
        />
      </div>
    </div>
  );
};