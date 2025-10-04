console.log('开始测试导入...')

// 测试样式导入
try {
  import('@prompt-matrix/ui/style.css')
  console.log('✅ 样式导入成功')
} catch (error) {
  console.error('❌ 样式导入失败:', error)
}

// 测试UI包组件导入
try {
  import('@prompt-matrix/ui').then(ui => {
    console.log('✅ UI包导入成功:', Object.keys(ui))
  }).catch(error => {
    console.error('❌ UI包导入失败:', error)
  })
} catch (error) {
  console.error('❌ UI包导入失败:', error)
}

// 测试Core包导入
try {
  import('@prompt-matrix/core').then(core => {
    console.log('✅ Core包导入成功:', Object.keys(core))
  }).catch(error => {
    console.error('❌ Core包导入失败:', error)
  })
} catch (error) {
  console.error('❌ Core包导入失败:', error)
}