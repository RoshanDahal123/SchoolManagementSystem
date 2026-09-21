using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.DTOs.Storage
{
    public sealed record FileUpload(string FileName, string ContentType, long Length, Stream Content);
    public sealed record StoredFile(string StoredPath, string FileName, string ContentType, long Length);
    public sealed record FileDownload(Stream Content, string ContentType, string FileName);

}
