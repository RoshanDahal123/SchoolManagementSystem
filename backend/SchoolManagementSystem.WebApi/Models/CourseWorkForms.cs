using SchoolManagementSystem.Application.DTOs.Storage;
namespace SchoolManagementSystem.WebApi.Models;

public class CreateCourseWorkForms
{
public Guid ClassSubjectId { get; set; }
public string Title { get; set; } = string.Empty;
public string? Instructions { get; set; }
public DateTimeOffset DueAtUtc { get; set; }
public decimal MaxMarks { get; set; }
public bool AllowLateSubmission { get; set; } = true;
public List<IFormFile>? Files { get; set; }


}
public class SubmitCourseworkForm
{
    public string? Note { get; set; }
    public List<IFormFile>? Files { get; set; }
}

public class FileUploadForm
{
    public List<IFormFile>? Files { get; set; }
}
public sealed class FileUploadCollection : IDisposable
{
    private readonly List<Stream> _streams;

    public IReadOnlyList<FileUpload> Items { get; }

    public FileUploadCollection(IReadOnlyList<FileUpload> items, List<Stream> streams)
    {
        Items = items;
        _streams = streams;
    }

    public void Dispose()
    {
        foreach (var stream in _streams)
            stream.Dispose();
    }
}
    public static class FormFileExtensions
    {
        public static FileUploadCollection ToFileUploads(this List<IFormFile>? files)
        {
            var items = new List<FileUpload>();
            var streams = new List<Stream>();
            foreach (var file in files ?? new List<IFormFile>())
            {
                if (file.Length <= 0) continue;

                var stream = file.OpenReadStream();
                streams.Add(stream);

                items.Add(new FileUpload(
                    Path.GetFileName(file.FileName),
                    file.ContentType ?? "application/octet-stream",
                    file.Length,
                    stream));
            }
            return new FileUploadCollection(items, streams);
        }

    }

