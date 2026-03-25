export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner';
  label: string;
  time: string;
  dishes: Dish[];
  calories: number; // 估算总热量 kcal
  tips?: string;
}

export interface Dish {
  name: string;
  ingredients: string[];
  description: string;
}

export interface DayMealPlan {
  day: string;       // "周一"
  dayKey: number;    // 1-7
  theme: string;     // 当日饮食主题
  meals: Meal[];
}

export const weeklyMealPlan: DayMealPlan[] = [
  {
    day: '周一',
    dayKey: 1,
    theme: '元气满满·高蛋白日',
    meals: [
      {
        type: 'breakfast',
        label: '早餐',
        time: '07:00',
        calories: 450,
        dishes: [
          {
            name: '全麦三明治',
            ingredients: ['全麦面包2片', '鸡蛋1个', '生菜', '番茄片', '牛油果半个'],
            description: '全麦面包提供复合碳水，牛油果富含优质脂肪',
          },
          {
            name: '希腊酸奶碗',
            ingredients: ['希腊酸奶150g', '蓝莓', '燕麦片', '蜂蜜少许'],
            description: '高蛋白酸奶搭配抗氧化莓果',
          },
          {
            name: '黑咖啡/绿茶',
            ingredients: ['黑咖啡或绿茶1杯'],
            description: '提神醒脑，不加糖',
          },
        ],
      },
      {
        type: 'lunch',
        label: '午餐',
        time: '12:00',
        calories: 650,
        dishes: [
          {
            name: '香煎鸡胸肉',
            ingredients: ['鸡胸肉150g', '黑胡椒', '橄榄油', '迷迭香'],
            description: '低脂高蛋白，煎至金黄',
          },
          {
            name: '藜麦蔬菜沙拉',
            ingredients: ['藜麦80g', '黄瓜', '彩椒', '紫甘蓝', '橄榄油醋汁'],
            description: '藜麦是完全蛋白质来源',
          },
          {
            name: '紫菜蛋花汤',
            ingredients: ['紫菜', '鸡蛋1个', '葱花', '香油'],
            description: '补碘，清淡开胃',
          },
        ],
      },
      {
        type: 'dinner',
        label: '晚餐',
        time: '18:30',
        calories: 500,
        dishes: [
          {
            name: '清蒸鲈鱼',
            ingredients: ['鲈鱼1条', '姜丝', '葱丝', '蒸鱼豉油'],
            description: '优质蛋白和omega-3脂肪酸',
          },
          {
            name: '蒜蓉西兰花',
            ingredients: ['西兰花200g', '蒜末', '橄榄油'],
            description: '十字花科蔬菜，抗氧化',
          },
          {
            name: '杂粮饭',
            ingredients: ['糙米', '小米', '红豆', '适量'],
            description: '低GI主食，饱腹感强',
          },
        ],
      },
    ],
  },
  {
    day: '周二',
    dayKey: 2,
    theme: '地中海风情·护心日',
    meals: [
      {
        type: 'breakfast',
        label: '早餐',
        time: '07:00',
        calories: 420,
        dishes: [
          {
            name: '燕麦粥',
            ingredients: ['燕麦片50g', '牛奶200ml', '香蕉半根', '核桃碎', '肉桂粉'],
            description: '慢碳释放，持续供能到中午',
          },
          {
            name: '水煮蛋',
            ingredients: ['鸡蛋2个'],
            description: '完美蛋白质来源',
          },
          {
            name: '鲜橙汁',
            ingredients: ['鲜榨橙子1个'],
            description: '补充维C，增强免疫',
          },
        ],
      },
      {
        type: 'lunch',
        label: '午餐',
        time: '12:00',
        calories: 680,
        dishes: [
          {
            name: '番茄炖牛腩',
            ingredients: ['牛腩150g', '番茄2个', '土豆', '胡萝卜', '洋葱'],
            description: '番茄红素+铁元素，暖胃又营养',
          },
          {
            name: '凉拌秋葵',
            ingredients: ['秋葵150g', '蒜末', '生抽', '香油', '芝麻'],
            description: '润肠通便，富含膳食纤维',
          },
          {
            name: '米饭',
            ingredients: ['大米适量'],
            description: '搭配炖菜，适量即可',
          },
        ],
      },
      {
        type: 'dinner',
        label: '晚餐',
        time: '18:30',
        calories: 480,
        dishes: [
          {
            name: '三文鱼牛油果盖饭',
            ingredients: ['三文鱼100g', '牛油果半个', '寿司米', '海苔碎', '芝麻', '酱油'],
            description: 'omega-3丰富，护心护脑',
          },
          {
            name: '味噌汤',
            ingredients: ['味噌酱', '豆腐', '海带', '葱花'],
            description: '发酵食物，有益肠道健康',
          },
          {
            name: '毛豆',
            ingredients: ['盐水毛豆100g'],
            description: '植物蛋白零食，低卡饱腹',
          },
        ],
      },
    ],
  },
  {
    day: '周三',
    dayKey: 3,
    theme: '中式养生·健脾日',
    meals: [
      {
        type: 'breakfast',
        label: '早餐',
        time: '07:00',
        calories: 400,
        dishes: [
          {
            name: '小米南瓜粥',
            ingredients: ['小米50g', '南瓜100g', '红枣3颗', '枸杞'],
            description: '养胃健脾，温补气血',
          },
          {
            name: '韭菜鸡蛋饼',
            ingredients: ['鸡蛋2个', '韭菜', '面粉少许', '盐'],
            description: '补肾温阳，简单快手',
          },
          {
            name: '豆浆',
            ingredients: ['黄豆', '黑豆', '核桃'],
            description: '自制五谷豆浆，营养丰富',
          },
        ],
      },
      {
        type: 'lunch',
        label: '午餐',
        time: '12:00',
        calories: 620,
        dishes: [
          {
            name: '山药排骨汤',
            ingredients: ['猪小排200g', '山药', '枸杞', '姜片', '葱段'],
            description: '滋补脾胃，补钙强骨',
          },
          {
            name: '清炒时蔬',
            ingredients: ['菠菜200g', '蒜片', '橄榄油'],
            description: '补铁补叶酸，深绿蔬菜首选',
          },
          {
            name: '红薯饭',
            ingredients: ['大米', '红薯100g'],
            description: '粗细搭配，膳食纤维丰富',
          },
        ],
      },
      {
        type: 'dinner',
        label: '晚餐',
        time: '18:30',
        calories: 460,
        dishes: [
          {
            name: '虾仁豆腐煲',
            ingredients: ['鲜虾100g', '嫩豆腐1块', '青豆', '胡萝卜丁', '姜蒜'],
            description: '高蛋白低脂，鲜美暖胃',
          },
          {
            name: '凉拌木耳黄瓜',
            ingredients: ['黑木耳', '黄瓜', '蒜末', '醋', '香油', '辣椒油'],
            description: '清血管，爽口下饭',
          },
          {
            name: '杂粮馒头',
            ingredients: ['全麦馒头1个'],
            description: '粗粮主食，饱腹不长胖',
          },
        ],
      },
    ],
  },
  {
    day: '周四',
    dayKey: 4,
    theme: '轻食排毒·高纤日',
    meals: [
      {
        type: 'breakfast',
        label: '早餐',
        time: '07:00',
        calories: 380,
        dishes: [
          {
            name: '牛油果吐司',
            ingredients: ['全麦吐司1片', '牛油果半个', '番茄片', '柠檬汁', '黑胡椒'],
            description: '优质脂肪+复合碳水',
          },
          {
            name: '奇亚籽布丁',
            ingredients: ['奇亚籽15g', '椰奶200ml', '芒果丁', '蜂蜜'],
            description: '提前一晚泡好，富含omega-3和纤维',
          },
          {
            name: '柠檬温水',
            ingredients: ['温水', '柠檬片'],
            description: '晨起第一杯，唤醒肠胃',
          },
        ],
      },
      {
        type: 'lunch',
        label: '午餐',
        time: '12:00',
        calories: 580,
        dishes: [
          {
            name: '黑椒牛肉粒',
            ingredients: ['牛里脊120g', '彩椒', '洋葱', '黑胡椒酱', '橄榄油'],
            description: '补铁补锌，彩椒富含维C促进铁吸收',
          },
          {
            name: '西红柿鸡蛋面',
            ingredients: ['全麦面条', '番茄2个', '鸡蛋1个', '葱花'],
            description: '番茄酸甜开胃，全麦面低GI',
          },
          {
            name: '拍黄瓜',
            ingredients: ['黄瓜', '蒜末', '醋', '香油', '花生碎'],
            description: '清热解暑，爽脆开胃',
          },
        ],
      },
      {
        type: 'dinner',
        label: '晚餐',
        time: '18:30',
        calories: 420,
        dishes: [
          {
            name: '杂蔬鸡肉沙拉',
            ingredients: ['鸡胸肉100g', '生菜', '玉米粒', '小番茄', '鹰嘴豆', '油醋汁'],
            description: '高纤高蛋白，晚餐轻食首选',
          },
          {
            name: '红豆薏米汤',
            ingredients: ['红豆', '薏米', '冰糖少许'],
            description: '祛湿排毒，适合南方气候',
          },
          {
            name: '蒸玉米',
            ingredients: ['甜玉米1根'],
            description: '粗粮代替精米，饱腹感强',
          },
        ],
      },
    ],
  },
  {
    day: '周五',
    dayKey: 5,
    theme: '海鲜丰盛·补脑日',
    meals: [
      {
        type: 'breakfast',
        label: '早餐',
        time: '07:00',
        calories: 430,
        dishes: [
          {
            name: '鸡蛋灌饼',
            ingredients: ['面粉', '鸡蛋2个', '生菜', '甜面酱'],
            description: '周五犒劳自己，手工灌饼香酥可口',
          },
          {
            name: '紫薯牛奶',
            ingredients: ['紫薯100g', '纯牛奶200ml'],
            description: '花青素+钙质，打成奶昔更方便',
          },
          {
            name: '坚果一把',
            ingredients: ['混合坚果20g（杏仁、腰果、核桃）'],
            description: '补脑益智，控制份量',
          },
        ],
      },
      {
        type: 'lunch',
        label: '午餐',
        time: '12:00',
        calories: 700,
        dishes: [
          {
            name: '蒜蓉粉丝蒸虾',
            ingredients: ['大虾8只', '粉丝', '蒜蓉', '葱花', '蒸鱼豉油'],
            description: '高蛋白低脂，虾含丰富虾青素',
          },
          {
            name: '干锅花菜',
            ingredients: ['花菜200g', '五花肉少许', '干辣椒', '蒜片'],
            description: '花菜富含维C和膳食纤维',
          },
          {
            name: '紫米饭',
            ingredients: ['紫米', '大米混合'],
            description: '花青素丰富，抗氧化',
          },
        ],
      },
      {
        type: 'dinner',
        label: '晚餐',
        time: '18:30',
        calories: 520,
        dishes: [
          {
            name: '清炒虾仁西芹',
            ingredients: ['虾仁100g', '西芹', '百合', '枸杞', '盐'],
            description: '虾仁补蛋白，西芹降压安神',
          },
          {
            name: '番茄豆腐汤',
            ingredients: ['番茄1个', '豆腐1块', '香菜', '盐'],
            description: '酸甜开胃，补钙补蛋白',
          },
          {
            name: '荞麦面',
            ingredients: ['荞麦面100g', '葱花', '酱油'],
            description: '低GI杂粮面，控糖好选择',
          },
        ],
      },
    ],
  },
  {
    day: '周六',
    dayKey: 6,
    theme: '慢享周末·滋补日',
    meals: [
      {
        type: 'breakfast',
        label: '早餐（Brunch）',
        time: '08:30',
        calories: 520,
        tips: '周末可以晚起，来一顿丰盛的早午餐',
        dishes: [
          {
            name: '班尼迪克蛋',
            ingredients: ['英式松饼', '鸡蛋2个（水波蛋）', '火腿片', '荷兰酱'],
            description: '经典西式早午餐，犒劳辛苦一周的自己',
          },
          {
            name: '水果拼盘',
            ingredients: ['草莓', '蓝莓', '猕猴桃', '火龙果'],
            description: '多彩水果，维生素全面补充',
          },
          {
            name: '拿铁/抹茶',
            ingredients: ['咖啡或抹茶+牛奶'],
            description: '周末慢享一杯',
          },
        ],
      },
      {
        type: 'lunch',
        label: '午餐',
        time: '13:00',
        calories: 650,
        dishes: [
          {
            name: '红烧排骨',
            ingredients: ['猪排骨300g', '冰糖', '老抽', '生抽', '八角', '桂皮', '姜'],
            description: '周末硬菜，补充胶原蛋白',
          },
          {
            name: '蒜蓉空心菜',
            ingredients: ['空心菜200g', '蒜末', '橄榄油'],
            description: '应季蔬菜，清热解毒',
          },
          {
            name: '莲藕排骨汤',
            ingredients: ['莲藕', '排骨', '红枣', '盐'],
            description: '滋阴润燥，广西特色靓汤',
          },
          {
            name: '米饭',
            ingredients: ['大米'],
            description: '配排骨和汤，适量即可',
          },
        ],
      },
      {
        type: 'dinner',
        label: '晚餐',
        time: '18:30',
        calories: 450,
        dishes: [
          {
            name: '清蒸金鲳鱼',
            ingredients: ['金鲳鱼1条', '姜丝', '葱丝', '蒸鱼豉油', '花生油'],
            description: '广西新鲜海鱼，简单蒸最好吃',
          },
          {
            name: '上汤娃娃菜',
            ingredients: ['娃娃菜2颗', '皮蛋1个', '枸杞', '蒜片'],
            description: '鲜甜可口，维生素丰富',
          },
          {
            name: '红薯粥',
            ingredients: ['大米', '红薯', '水'],
            description: '晚餐喝粥，肠胃轻松',
          },
        ],
      },
    ],
  },
  {
    day: '周日',
    dayKey: 7,
    theme: '调整恢复·清肠日',
    meals: [
      {
        type: 'breakfast',
        label: '早餐',
        time: '08:00',
        calories: 400,
        dishes: [
          {
            name: '皮蛋瘦肉粥',
            ingredients: ['大米80g', '皮蛋1个', '猪瘦肉50g', '姜丝', '葱花', '盐'],
            description: '经典中式粥品，暖胃养人',
          },
          {
            name: '小笼包',
            ingredients: ['鲜肉小笼包3个'],
            description: '搭配粥品，满足感十足',
          },
          {
            name: '凉拌海带丝',
            ingredients: ['海带丝', '蒜末', '醋', '辣椒油', '芝麻'],
            description: '补碘，促进新陈代谢',
          },
        ],
      },
      {
        type: 'lunch',
        label: '午餐',
        time: '12:00',
        calories: 600,
        dishes: [
          {
            name: '酸菜鱼',
            ingredients: ['草鱼片200g', '酸菜', '花椒', '干辣椒', '蒜', '姜'],
            description: '开胃下饭，鱼肉高蛋白低脂',
          },
          {
            name: '蒜苗炒腊肉',
            ingredients: ['腊肉50g', '蒜苗', '干辣椒'],
            description: '少量腊肉提味，蒜苗杀菌',
          },
          {
            name: '丝瓜蛋汤',
            ingredients: ['丝瓜', '鸡蛋1个', '葱花'],
            description: '清热利尿，适合南方气候',
          },
          {
            name: '米饭',
            ingredients: ['大米'],
            description: '适量',
          },
        ],
      },
      {
        type: 'dinner',
        label: '晚餐',
        time: '18:30',
        calories: 380,
        tips: '周日晚餐清淡，为新的一周做好准备',
        dishes: [
          {
            name: '蔬菜粥',
            ingredients: ['大米', '胡萝卜', '青菜', '香菇', '盐'],
            description: '清肠养胃，为新一周做准备',
          },
          {
            name: '白灼生菜',
            ingredients: ['生菜200g', '蒜蓉', '蚝油', '热油'],
            description: '简单清淡，维生素丰富',
          },
          {
            name: '蒸南瓜',
            ingredients: ['贝贝南瓜半个'],
            description: '天然甜味，富含胡萝卜素，代替甜食',
          },
        ],
      },
    ],
  },
];

// 一周购物清单生成
export function generateShoppingList(plans: DayMealPlan[]): Record<string, string[]> {
  const categories: Record<string, Set<string>> = {
    '肉类蛋奶': new Set(),
    '海鲜水产': new Set(),
    '蔬菜': new Set(),
    '水果': new Set(),
    '主食谷物': new Set(),
    '豆制品': new Set(),
    '调味品': new Set(),
    '坚果干货': new Set(),
    '饮品': new Set(),
  };

  const ingredientCategory: Record<string, string> = {
    '鸡胸肉': '肉类蛋奶', '鸡蛋': '肉类蛋奶', '猪小排': '肉类蛋奶', '猪排骨': '肉类蛋奶',
    '牛腩': '肉类蛋奶', '牛里脊': '肉类蛋奶', '五花肉': '肉类蛋奶', '猪瘦肉': '肉类蛋奶',
    '火腿片': '肉类蛋奶', '腊肉': '肉类蛋奶', '纯牛奶': '肉类蛋奶', '牛奶': '肉类蛋奶',
    '希腊酸奶': '肉类蛋奶', '皮蛋': '肉类蛋奶',
    '鲈鱼': '海鲜水产', '三文鱼': '海鲜水产', '大虾': '海鲜水产', '鲜虾': '海鲜水产',
    '虾仁': '海鲜水产', '金鲳鱼': '海鲜水产', '草鱼片': '海鲜水产',
    '西兰花': '蔬菜', '菠菜': '蔬菜', '生菜': '蔬菜', '番茄': '蔬菜', '黄瓜': '蔬菜',
    '彩椒': '蔬菜', '洋葱': '蔬菜', '胡萝卜': '蔬菜', '南瓜': '蔬菜', '山药': '蔬菜',
    '红薯': '蔬菜', '紫薯': '蔬菜', '土豆': '蔬菜', '秋葵': '蔬菜', '西芹': '蔬菜',
    '花菜': '蔬菜', '空心菜': '蔬菜', '娃娃菜': '蔬菜', '丝瓜': '蔬菜', '莲藕': '蔬菜',
    '韭菜': '蔬菜', '紫甘蓝': '蔬菜', '青菜': '蔬菜', '蒜苗': '蔬菜', '香菇': '蔬菜',
    '黑木耳': '蔬菜', '玉米': '蔬菜',
    '草莓': '水果', '蓝莓': '水果', '猕猴桃': '水果', '火龙果': '水果', '香蕉': '水果',
    '橙子': '水果', '芒果': '水果', '柠檬': '水果', '牛油果': '水果',
    '全麦面包': '主食谷物', '全麦吐司': '主食谷物', '大米': '主食谷物', '糙米': '主食谷物',
    '小米': '主食谷物', '紫米': '主食谷物', '藜麦': '主食谷物', '燕麦片': '主食谷物',
    '红豆': '主食谷物', '薏米': '主食谷物', '荞麦面': '主食谷物', '全麦面条': '主食谷物',
    '粉丝': '主食谷物', '面粉': '主食谷物',
    '豆腐': '豆制品', '嫩豆腐': '豆制品', '黄豆': '豆制品', '黑豆': '豆制品',
    '毛豆': '豆制品', '鹰嘴豆': '豆制品', '味噌酱': '豆制品',
    '橄榄油': '调味品', '蒸鱼豉油': '调味品', '老抽': '调味品', '生抽': '调味品',
    '醋': '调味品', '香油': '调味品', '蜂蜜': '调味品', '花生油': '调味品',
    '混合坚果': '坚果干货', '核桃': '坚果干货', '红枣': '坚果干货', '枸杞': '坚果干货',
    '奇亚籽': '坚果干货', '花生碎': '坚果干货', '海带': '坚果干货', '紫菜': '坚果干货',
    '百合': '坚果干货', '酸菜': '坚果干货',
  };

  plans.forEach((plan) => {
    plan.meals.forEach((meal) => {
      meal.dishes.forEach((dish) => {
        dish.ingredients.forEach((ing) => {
          // 简化处理：取食材名称关键词
          const name = ing.replace(/[\d.]+[gml个只颗根条块片把少许适量半]*$/, '').trim();
          const cat = ingredientCategory[name];
          if (cat) {
            categories[cat].add(ing);
          }
        });
      });
    });
  });

  const result: Record<string, string[]> = {};
  Object.entries(categories).forEach(([cat, items]) => {
    if (items.size > 0) result[cat] = Array.from(items);
  });
  return result;
}
