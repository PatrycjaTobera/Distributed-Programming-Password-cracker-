using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using backend___central.Models;

namespace backend___central.Interfaces
{
    public interface IResponseProcessingService
    {
        IActionResult ProcessResults(ServerTaskResult taskResult, BruteForceRequestData credentials, CrackingCharPackage charPackage, int totalTime);
        IActionResult ProcessDictionaryResult(bool passwordFound, PasswordInfo? passwordInfo, int totalTime, Dictionary<string, int> serversTimes);
        IActionResult HandleError(System.Exception ex, int executionTime, bool isDictionary = false);
    }
}