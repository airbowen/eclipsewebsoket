import { test, expect, Page } from '@playwright/test'

test('测试多客户端数据同步', async ({ browser }) => {
  // 启动两个客户端
  const client1 = await browser.newPage()
  const client2 = await browser.newPage()

  // 客户端1连接
  await client1.goto('http://localhost:5173')
  await expect(client1.locator('text=Status: Connected')).toBeVisible()
  
  // 等待一些数据加载
  await client1.waitForTimeout(2000)
  
  // 记录客户端1的数据状态
  const client1Data = await client1.locator('tbody tr').count()
  
  // 客户端2连接
  await client2.goto('http://localhost:5173')
  await expect(client2.locator('text=Status: Connected')).toBeVisible()
  
  // 等待新数据到达
  await client2.waitForTimeout(2000)
  
  // 验证客户端2只接收新数据
  const client2Data = await client2.locator('tbody tr').count()
  expect(client2Data).toBeLessThan(client1Data)
  
  // 验证数据同步
  async function getLatestData(page: Page) {
    const rows = await page.locator('tbody tr').all()
    if (rows.length === 0) return null
    const lastRow = rows[rows.length - 1]
    return {
      portfolio: await lastRow.locator('td').nth(0).textContent(),
      code: await lastRow.locator('td').nth(1).textContent(),
      price: await lastRow.locator('td').nth(3).textContent()
    }
  }
  
  // 等待并比较两个客户端的最新数据
  await client1.waitForTimeout(1000)
  const client1Latest = await getLatestData(client1)
  const client2Latest = await getLatestData(client2)
  expect(client1Latest).toEqual(client2Latest)
  
  // 测试断开连接
  await client1.close()
  await client2.close()
  
  // 重新连接一个客户端，验证数据重新开始发送
  const newClient = await browser.newPage()
  await newClient.goto('http://localhost:5173')
  await expect(newClient.locator('text=Status: Connected')).toBeVisible()
  await newClient.waitForTimeout(2000)
  const newClientData = await newClient.locator('tbody tr').count()
  expect(newClientData).toBeGreaterThan(0)
})