using System;
using System.IO;
using backend___central.Interfaces;

namespace backend___central.Services
{
    public class ErrorLogService : ILogService
    {
        private string LogContent { get; set; } = "";

        public override void LogMessage(string message)
        {
            string timestamp = GetCurrentDate();
            LogContent = $"Log z serwera centralnego: {message}";
            Console.WriteLine(LogContent);
            SaveToFile();
        }

        public override void SaveToFile()
        {
            try
            {
                using FileStream fileStream = new(logFilePath, FileMode.Append, FileAccess.Write, FileShare.ReadWrite);
                using StreamWriter writer = new(fileStream);
                writer.WriteLine(LogContent);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"(WYBUCH) Wystapil blad w serwerze obliczeniowym i zapisano w pliku: {ex.Message}");
            }
        }
    }
}