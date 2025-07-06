using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Json;
using System.Collections.Concurrent;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("http://localhost:5173")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});

var app = builder.Build();
app.UseCors();

var webSocketOptions = new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromMinutes(2)
};
app.UseWebSockets(webSocketOptions);

// 存储所有活动的 WebSocket 连接
var activeConnections = new ConcurrentDictionary<string, System.Net.WebSockets.WebSocket>();
// 记录当前数据发送位置
var currentIndex = 1;
var isPublishing = false;

// WebSocket路由处理
app.Map("/ws", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        var connectionId = Guid.NewGuid().ToString();
        activeConnections.TryAdd(connectionId, webSocket);

        try
        {
            // 如果这是第一个客户端连接且未在发布数据，开始发布数据
            if (activeConnections.Count == 1 && !isPublishing)
            {
                isPublishing = true;
                currentIndex = 1;  // 重置索引到开始位置
                _ = PublishDataAsync(); // 在后台开始发布数据
            }

            // 保持连接直到客户端断开
            while (webSocket.State == System.Net.WebSockets.WebSocketState.Open)
            {
                await Task.Delay(1000);
            }
        }
        finally
        {
            activeConnections.TryRemove(connectionId, out _);
            // 如果没有活动连接了，停止发布
            if (activeConnections.IsEmpty)
            {
                isPublishing = false;
                currentIndex = 1; // 重置索引
            }
        }
    }
    else
    {
        context.Response.StatusCode = 400;
    }
});

async Task PublishDataAsync()
{
    var csvPath = Path.Combine(Directory.GetCurrentDirectory(), "data.csv");
    var lines = await File.ReadAllLinesAsync(csvPath);
    
    while (isPublishing)
    {
        for (int i = currentIndex; i < lines.Length && isPublishing; i++)
        {
            var values = lines[i].Split(',');
            var rowData = new
            {
                Time = values[0],
                RowId = values[1],
                Action = values[2],
                Portfolio = values[3],
                Code = values[4],
                Name = values[5],
                Price = values[6],
                Quantity = values[7]
            };
            
            var jsonData = JsonSerializer.Serialize(rowData);
            var buffer = Encoding.UTF8.GetBytes(jsonData);
            
            var sendTasks = activeConnections.Values.ToList().Select(async ws =>
            {
                if (ws.State == System.Net.WebSockets.WebSocketState.Open)
                {
                    try
                    {
                        await ws.SendAsync(
                            new ArraySegment<byte>(buffer),
                            System.Net.WebSockets.WebSocketMessageType.Text,
                            true,
                            CancellationToken.None
                        );
                    }
                    catch {}
                }
            });
            
            await Task.WhenAll(sendTasks);
            currentIndex = i + 1;
            
            // 根据Time列的值决定等待时间
            if (i + 1 < lines.Length)
            {
                var nextValues = lines[i + 1].Split(',');
                var timeDiff = int.Parse(nextValues[0]) - int.Parse(values[0]);
                if (timeDiff > 0)
                {
                    await Task.Delay(timeDiff * 1000);
                }
            }
        }
        
        // 一轮结束，重新开始
        currentIndex = 1;
    }
}

app.MapControllers();
app.Run();
app.MapGet("/", () => "Hello World!");

app.Run();