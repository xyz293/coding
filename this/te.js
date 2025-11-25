// 配置参数（可调整）
const CONFIG = {
  PHYSICAL_MEM_SIZE: 1024 * 1024, // 1MB物理内存
  PAGE_SIZE: 4 * 1024,             // 4KB页面大小
  MAX_PROCESSES: 10,               // 最大支持进程数
  MAX_PAGES_PER_PROCESS: 64        // 单个进程最大页数（4KB×64=256KB）
};

// 进程页表项类
class PageTableEntry {
  constructor() {
    this.valid = false; // 有效位：false=未分配，true=已分配
    this.block = -1;    // 对应的物理块号（-1表示未分配）
  }
}

// 进程控制块（PCB）类
class Process {
  constructor(pid, memSize) {
    this.pid = pid;                          // 进程ID
    this.memSize = memSize;                  // 进程内存需求（字节）
    this.pageCount = Math.ceil(memSize / CONFIG.PAGE_SIZE); // 所需页数（向上取整）
    this.pageTable = [];                     // 页表：存储PageTableEntry实例
    this.isRunning = true;                   // 运行状态

    // 初始化页表
    for (let i = 0; i < this.pageCount; i++) {
      this.pageTable.push(new PageTableEntry());
    }
  }
}

// 物理内存类（位示图管理）
class PhysicalMemory {
  constructor() {
    this.totalBlocks = CONFIG.PHYSICAL_MEM_SIZE / CONFIG.PAGE_SIZE; // 物理块总数
    this.freeBlocks = this.totalBlocks;                            // 空闲块数
    // 位示图：用数组存储，每个元素代表1个物理块的状态（0=空闲，1=已分配）
    this.bitMap = new Array(this.totalBlocks).fill(0);
  }

  // 随机生成初始占用块（模拟系统初始占用）
  randomInitUsedBlocks() {
    const maxUsed = Math.floor(this.totalBlocks / 4); // 最多占用1/4内存
    const usedCount = Math.floor(Math.random() * maxUsed);

    for (let i = 0; i < usedCount; i++) {
      const blockIdx = Math.floor(Math.random() * this.totalBlocks);
      if (this.bitMap[blockIdx] === 0) { // 确保未被占用
        this.bitMap[blockIdx] = 1;
        this.freeBlocks--;
      }
    }
  }

  // 查找n个空闲物理块（返回块号数组，失败返回null）
  findFreeBlocks(n) {
    if (n <= 0 || n > this.freeBlocks) return null;

    const freeBlockIds = [];
    for (let i = 0; i < this.totalBlocks && freeBlockIds.length < n; i++) {
      if (this.bitMap[i] === 0) {
        freeBlockIds.push(i);
      }
    }
    return freeBlockIds.length === n ? freeBlockIds : null;
  }

  // 标记物理块为已分配
  markBlockUsed(blockIds) {
    blockIds.forEach(id => {
      this.bitMap[id] = 1;
      this.freeBlocks--;
    });
  }

  // 标记物理块为空闲（回收）
  markBlockFree(blockIds) {
    blockIds.forEach(id => {
      this.bitMap[id] = 0;
      this.freeBlocks++;
    });
  }
}

// 内存管理器核心类
class MemoryManager {
  constructor() {
    this.physicalMemory = new PhysicalMemory(); // 物理内存实例
    this.processes = [];                        // 运行中的进程列表
  }

  // 初始化内存管理器（可选随机生成初始占用块）
  init(randomUsed = false) {
    if (randomUsed) {
      this.physicalMemory.randomInitUsedBlocks();
    }
    console.log(`物理内存初始化完成：
      总大小：${CONFIG.PHYSICAL_MEM_SIZE / 1024 / 1024}MB，
      页大小：${CONFIG.PAGE_SIZE / 1024}KB，
      总块数：${this.physicalMemory.totalBlocks}，
      空闲块数：${this.physicalMemory.freeBlocks}`);
  }

  // 1. 创建进程并分配内存
  createProcess(pid, memSizeKB) {
    const memSize = memSizeKB * 1024; // 转为字节

    // 校验参数合法性
    if (memSize <= 0 || memSize > CONFIG.MAX_PAGES_PER_PROCESS * CONFIG.PAGE_SIZE) {
      alert(`错误：进程内存需求超出限制（最大${CONFIG.MAX_PAGES_PER_PROCESS * CONFIG.PAGE_SIZE / 1024}KB）`);
      return false;
    }
    if (this.processes.some(p => p.pid === pid)) {
      alert(`错误：进程ID=${pid}已存在`);
      return false;
    }
    if (this.processes.length >= CONFIG.MAX_PROCESSES) {
      alert(`错误：超出最大进程数限制（${CONFIG.MAX_PROCESSES}个）`);
      return false;
    }

    // 创建进程实例
    const process = new Process(pid, memSize);
    console.log(`进程ID=${pid}，内存需求=${memSizeKB}KB，需分配页数=${process.pageCount}`);

    // 查找空闲块
    const freeBlocks = this.physicalMemory.findFreeBlocks(process.pageCount);
    if (!freeBlocks) {
      alert(`错误：物理内存不足，分配失败`);
      return false;
    }

    // 分配物理块并更新页表
    freeBlocks.forEach((blockId, idx) => {
      process.pageTable[idx].valid = true;
      process.pageTable[idx].block = blockId;
    });
    this.physicalMemory.markBlockUsed(freeBlocks);
    this.processes.push(process);

    alert(`进程ID=${pid}创建成功！分配物理块：${freeBlocks.join(' ')}`);
    console.log(`进程ID=${pid}创建成功，分配物理块：${freeBlocks.join(' ')}`);
    return true;
  }

  // 2. 终止进程并回收内存
  destroyProcess(pid) {
    // 查找进程
    const procIndex = this.processes.findIndex(p => p.pid === pid);
    if (procIndex === -1) {
      alert(`错误：未找到进程ID=${pid}`);
      return false;
    }
    const process = this.processes[procIndex];
    if (!process.isRunning) {
      alert(`错误：进程ID=${pid}已终止`);
      return false;
    }

    // 回收物理块（收集进程占用的所有物理块号）
    const usedBlocks = process.pageTable
      .filter(entry => entry.valid)
      .map(entry => entry.block);
    this.physicalMemory.markBlockFree(usedBlocks);

    // 标记进程为终止并从列表中移除
    process.isRunning = false;
    this.processes.splice(procIndex, 1);

    alert(`进程ID=${pid}回收成功！释放物理块：${usedBlocks.join(' ')}`);
    console.log(`回收进程ID=${pid}的内存，释放物理块：${usedBlocks.join(' ')}`);
    return true;
  }

  // 3. 逻辑地址转物理地址
  logicalToPhysical(pid, logicalAddr) {
    // 查找运行中的进程
    const process = this.processes.find(p => p.pid === pid && p.isRunning);
    if (!process) {
      alert(`错误：未找到运行中的进程ID=${pid}`);
      return -1;
    }

    // 解析逻辑地址：页号 = 逻辑地址 / 页大小，页内偏移 = 逻辑地址 % 页大小
    const pageNum = Math.floor(logicalAddr / CONFIG.PAGE_SIZE);
    const offset = logicalAddr % CONFIG.PAGE_SIZE;

    // 校验合法性
    if (pageNum >= process.pageCount) {
      alert(`错误：逻辑地址页号=${pageNum}超出进程总页数=${process.pageCount}`);
      return -1;
    }
    const pageEntry = process.pageTable[pageNum];
    if (!pageEntry.valid) {
      alert(`错误：逻辑页号=${pageNum}未分配物理块`);
      return -1;
    }

    // 计算物理地址
    const physicalAddr = pageEntry.block * CONFIG.PAGE_SIZE + offset;
    const result = `
      地址转换成功！
      进程ID：${pid}
      逻辑地址：0x${logicalAddr.toString(16).toUpperCase()}（十进制：${logicalAddr}）
      物理地址：0x${physicalAddr.toString(16).toUpperCase()}（十进制：${physicalAddr}）
      解析详情：
        逻辑页号 = ${logicalAddr} / ${CONFIG.PAGE_SIZE} = ${pageNum}
        页内偏移 = ${logicalAddr} % ${CONFIG.PAGE_SIZE} = ${offset}
        物理块号 = ${pageEntry.block}
        物理地址 = ${pageEntry.block} × ${CONFIG.PAGE_SIZE} + ${offset} = ${physicalAddr}
    `;
    alert(result);
    console.log(result);
    return physicalAddr;
  }

  // 4. 获取内存使用状态（用于可视化）
  getMemoryStatus() {
    // 格式化位示图（每16个块一行，便于展示）
    const bitMapRows = [];
    for (let i = 0; i < this.physicalMemory.bitMap.length; i += 16) {
      bitMapRows.push(this.physicalMemory.bitMap.slice(i, i + 16).join(' '));
    }

    // 进程详情
    const processDetails = this.processes.map(proc => ({
      pid: proc.pid,
      memSizeKB: proc.memSize / 1024,
      pageCount: proc.pageCount,
      pageTable: proc.pageTable.map((entry, idx) => 
        `逻辑页${idx} → 物理块${entry.block}（${entry.valid ? '已分配' : '未分配'}）`
      ).join('\n')
    }));

    return {
      totalBlocks: this.physicalMemory.totalBlocks,
      freeBlocks: this.physicalMemory.freeBlocks,
      usedBlocks: this.physicalMemory.totalBlocks - this.physicalMemory.freeBlocks,
      bitMapRows,
      processCount: this.processes.length,
      processDetails
    };
  }
}