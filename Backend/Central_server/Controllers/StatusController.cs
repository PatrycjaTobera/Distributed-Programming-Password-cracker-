using Microsoft.AspNetCore.Mvc;

namespace Central_server.Controllers
{
    [ApiController]
    [Route("api/status")]
    public class StatusController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public StatusController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpGet("check-nodes")]
        public async Task<IActionResult> CheckNodes()
        {
            Console.WriteLine("[CENTRAL] => Sprawdzenie połączenia wywołane z Frontendu. Pinguję Serwer Obliczeniowy...");

            var client = _httpClientFactory.CreateClient("computeServer");
            var configuredBaseUrls = (_configuration["ComputeServerBaseUrls"] ?? string.Empty)
                .Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            var candidateBaseUrls = configuredBaseUrls
                .Concat(new[]
                {
                    "http://password-cracker-backend-calculating:5099",
                    "http://host.docker.internal:5099",
                    "http://localhost:5099"
                })
                .Distinct();

            string? lastError = null;

            foreach (var baseUrl in candidateBaseUrls)
            {
                var pingUrl = $"{baseUrl.TrimEnd('/')}/api/status/ping";

                try
                {
                    var response = await client.GetAsync(pingUrl);

                    if (!response.IsSuccessStatusCode)
                    {
                        lastError = $"Serwer obliczeniowy zwrócił kod statusu {(int)response.StatusCode} dla adresu '{pingUrl}'.";
                        continue;
                    }

                    var calculatingMessage = await response.Content.ReadAsStringAsync();

                    return Ok(new
                    {
                        frontendToCentral = "OK",
                        centralToCalculating = "OK",
                        calculatingMessage
                    });
                }
                catch (Exception ex)
                {
                    lastError = $"{ex.Message} (while calling '{pingUrl}')";
                }
            }

            return StatusCode(502, new
            {
                frontendToCentral = "OK",
                centralToCalculating = "ERROR",
                error = lastError ?? "Serwer obliczeniowy jest nieosiągalny."
            });
        }
    }
}
