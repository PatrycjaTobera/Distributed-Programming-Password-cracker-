using System.Text.Json.Serialization;

namespace backend___central.Models
{
    public class BruteForceResponse
    {
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("password")]
        public string? Password { get; set; }

        [JsonPropertyName("time")]
        public int Time { get; set; }
    }
}