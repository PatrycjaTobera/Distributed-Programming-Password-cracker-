using Microsoft.AspNetCore.Mvc;

namespace Compute_server.Controllers
{
    [ApiController]
    [Route("api/status")]
    public class StatusController : ControllerBase
    {
        [HttpGet("ping")]
        public IActionResult Ping()
        {
            Console.WriteLine("[CALCULATING] <= Otrzymano ping z Serwera Centralnego. Odpowiadam 'OK'.");
            return Ok("Wiadomosc z serwera obliczeniowego.");
        }
    }
}
