using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// 添加CORS支持
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

// Configure the HTTP request pipeline
app.UseCors();

// WebSocket支持
var webSocketOptions = new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromMinutes(2)
};
app.UseWebSockets(webSocketOptions);

// WebSocket路由处理
app.Map("/ws", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        var csvPath = Path.Combine(Directory.GetCurrentDirectory(), "data.csv");
        var lines = await File.ReadAllLinesAsync(csvPath);
        
        // 读取标题行
        var headers = lines[0].Split(',');
        
        // 处理数据行
        for (int i = 1; i < lines.Length; i++)
        {
            var values = lines[i].Split(',');
            var rowData = new
            {
                RowId = values[1],
                Portfolio = values[3],
                Code = values[4],
                Name = values[5],
                Price = values[6],
                Quantity = values[7]
            };
            
            var jsonData = JsonSerializer.Serialize(rowData);
            var buffer = Encoding.UTF8.GetBytes(jsonData);
            await webSocket.SendAsync(
                new ArraySegment<byte>(buffer),
                System.Net.WebSockets.WebSocketMessageType.Text,
                true,
                System.Threading.CancellationToken.None
            );
            
            // 每条数据之间暂停一秒
            await Task.Delay(1000);
        }
        
        // 保持连接活跃
        while (webSocket.State == System.Net.WebSockets.WebSocketState.Open)
        {
            await Task.Delay(1000);
        }
    }
    else
    {
        context.Response.StatusCode = 400;
    }
});

app.MapControllers();

app.Run();
app.MapGet("/", () => "Hello World!");

app.Run();