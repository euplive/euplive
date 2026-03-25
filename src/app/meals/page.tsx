'use client';

import { useState } from 'react';
import { weeklyMealPlan, generateShoppingList, type DayMealPlan, type Meal } from '@/constants/meals';

const mealTypeConfig = {
  breakfast: { icon: '🌅', color: '#f5a623' },
  lunch: { icon: '☀️', color: '#4ecdc4' },
  dinner: { icon: '🌙', color: '#8892a4' },
};

function MealCard({ meal }: { meal: Meal }) {
  const [expanded, setExpanded] = useState(false);
  const config = mealTypeConfig[meal.type];

  return (
    <div className="rounded-xl bg-[#1e2a4a] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#1e2a4a]/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div className="text-left">
            <p className="text-sm font-medium text-[#f0f0f0]">{meal.label}</p>
            <p className="text-xs text-[#8892a4]">{meal.time} · 约{meal.calories}kcal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {meal.dishes.map((d, i) => (
              <span key={i} className="rounded-full bg-[#2a3a5c] px-2 py-0.5 text-xs text-[#8892a4]">
                {d.name}
              </span>
            ))}
          </div>
          <span className={`text-[#8892a4] text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {meal.tips && (
            <p className="text-xs text-[#f5a623] bg-[#f5a623]/10 rounded-lg px-3 py-2">
              💡 {meal.tips}
            </p>
          )}
          {meal.dishes.map((dish, i) => (
            <div key={i} className="border-l-2 border-[#2a3a5c] pl-3">
              <p className="text-sm font-medium" style={{ color: config.color }}>
                {dish.name}
              </p>
              <p className="text-xs text-[#8892a4] mt-0.5">{dish.description}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {dish.ingredients.map((ing, j) => (
                  <span
                    key={j}
                    className="rounded bg-[#16213e] px-1.5 py-0.5 text-xs text-[#8892a4]"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-[#2a3a5c]">
            <span className="text-xs text-[#8892a4]">总热量</span>
            <span className="text-sm font-medium" style={{ color: config.color }}>
              ~{meal.calories} kcal
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function DayPlan({ plan }: { plan: DayMealPlan }) {
  const totalCalories = plan.meals.reduce((sum, m) => sum + m.calories, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#f0f0f0]">{plan.day}</h3>
          <p className="text-xs text-[#f5a623]">{plan.theme}</p>
        </div>
        <span className="text-xs text-[#8892a4] bg-[#1e2a4a] rounded-full px-3 py-1">
          全天 ~{totalCalories} kcal
        </span>
      </div>
      <div className="space-y-2">
        {plan.meals.map((meal, i) => (
          <MealCard key={i} meal={meal} />
        ))}
      </div>
    </div>
  );
}

function ShoppingList() {
  const list = generateShoppingList(weeklyMealPlan);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-center">一周购物清单</h2>
      <p className="text-xs text-[#8892a4] text-center">根据本周食谱自动生成，周末采购一次即可</p>
      {Object.entries(list).map(([category, items]) => (
        <div key={category} className="rounded-xl bg-[#1e2a4a] p-4">
          <h3 className="text-sm font-medium text-[#f5a623] mb-2">{category}</h3>
          <div className="flex flex-wrap gap-1.5">
            {items.map((item, i) => (
              <span key={i} className="rounded-lg bg-[#16213e] px-2 py-1 text-xs text-[#f0f0f0]">
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MealsPage() {
  const today = new Date().getDay(); // 0=周日, 1=周一...
  const todayKey = today === 0 ? 7 : today;
  const [activeDay, setActiveDay] = useState(todayKey);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const activePlan = weeklyMealPlan.find((p) => p.dayKey === activeDay);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-center">饮食规划</h1>
      <p className="text-xs text-[#8892a4] text-center">科学搭配 · 营养均衡 · 每日约1500-1600kcal</p>

      {/* 视图切换 */}
      <div className="flex rounded-xl bg-[#1a1a2e] p-1">
        <button
          onClick={() => setShowShoppingList(false)}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            !showShoppingList ? 'bg-[#f5a623] text-[#1a1a2e]' : 'text-[#8892a4]'
          }`}
        >
          每日食谱
        </button>
        <button
          onClick={() => setShowShoppingList(true)}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            showShoppingList ? 'bg-[#f5a623] text-[#1a1a2e]' : 'text-[#8892a4]'
          }`}
        >
          购物清单
        </button>
      </div>

      {!showShoppingList ? (
        <>
          {/* 星期选择 */}
          <div className="flex gap-1.5">
            {weeklyMealPlan.map((plan) => (
              <button
                key={plan.dayKey}
                onClick={() => setActiveDay(plan.dayKey)}
                className={`flex-1 rounded-lg py-2 text-center text-xs font-medium transition-all ${
                  activeDay === plan.dayKey
                    ? 'bg-[#f5a623] text-[#1a1a2e] scale-105'
                    : plan.dayKey === todayKey
                    ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/40'
                    : 'bg-[#1e2a4a] text-[#8892a4] hover:text-[#f0f0f0]'
                }`}
              >
                {plan.day}
                {plan.dayKey === todayKey && activeDay !== plan.dayKey && (
                  <div className="w-1 h-1 rounded-full bg-[#f5a623] mx-auto mt-0.5" />
                )}
              </button>
            ))}
          </div>

          {/* 当日食谱 */}
          {activePlan && <DayPlan plan={activePlan} />}

          {/* 营养小贴士 */}
          <div className="rounded-xl bg-[#4ecdc4]/10 border border-[#4ecdc4]/20 p-4">
            <h3 className="text-sm font-medium text-[#4ecdc4] mb-2">💡 饮食原则</h3>
            <ul className="text-xs text-[#8892a4] space-y-1">
              <li>• 每餐七八分饱，不要吃撑</li>
              <li>• 细嚼慢咽，每口咀嚼20次以上</li>
              <li>• 每天饮水2000ml以上</li>
              <li>• 晚餐在19:00前完成，睡前3小时不进食</li>
              <li>• 少油少盐少糖，多蒸煮少煎炸</li>
              <li>• 蔬菜每天500g以上，水果200-350g</li>
            </ul>
          </div>
        </>
      ) : (
        <ShoppingList />
      )}
    </div>
  );
}
