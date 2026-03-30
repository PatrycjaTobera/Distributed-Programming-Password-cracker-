using System;
using System.IO;
using backend___calculating.Interfaces;

namespace backend___calculating.Services
{
    public class ErrorLogService : ILogService
    {
        private string LogContent { get; set; } = "";

        public override void LogMessage(string message)
        {
            string timestamp = GetCurrentDate();
            LogContent = $"Log z serwera obliczeniowego: {message}";
            Console.WriteLine(LogContent);
            SaveToFile();
        }

        public override void SaveToFile()
        {
            try
            {
                File.AppendAllText(logFilePath, LogContent + Environment.NewLine);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"(WYBUCH) Wystapil blad w serwerze obliczeniowym i zapisano w pliku: {ex.Message}");
            }
        }
    }
}