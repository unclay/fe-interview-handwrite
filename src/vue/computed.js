// 当前effect
let activeEffect = null;
// 依赖收集：target -> key -> effect
const targetMap = new WeakMap();

const track = (target, key) => {
  if (!activeEffect) return;
  // 初始化 keyMap
  let keyMap = targetMap.get(target);
  if (!keyMap) {
    keyMap = new Map();
    targetMap.set(target, keyMap);
  }

  // 初始化 dep
  let dep = keyMap.get(key);
  if (!dep) {
    dep = new Set();
    keyMap.set(key, dep);
  }
  
  // 依赖收集：target（WeakMap） -> key(Map) -> effect（Set）
  dep.add(activeEffect);
}

const trigger = (target, key) => {
  const keyMap = targetMap.get(target);
  if (!keyMap) return;
  const dep = keyMap.get(key);
  if (!dep) return;

  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

const reactive = (obj) => {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      Reflect.set(target, key, value, receiver);
      trigger(target, key);
      return true;
    }
  })
}

class ReactiveEffect {
  constructor(effect, scheduler) {
    this.fn = effect;
    this.scheduler = scheduler;
    this.run();
  }

  run() {
    activeEffect = this;
    this.fn();
    activeEffect = null;
  }
}

const computed = (getter) => {
  let ditry = true;
  let value = null;
  const effectInstance = new ReactiveEffect(getter, () => {
    ditry = true;
  });
  return {
    get value() {
      if (ditry) {
        value = effectInstance.fn();
        ditry = false;
      }
      return value;
    }
  }
}

// 使用示例
const state = reactive({ count: 0 })
const double = computed(() => state.count * 2)

console.log(double.value) // 0
state.count = 5
console.log(double.value) // 10
