using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Migrations
{
    /// <inheritdoc />
    public partial class AddSectoonHomeRoomTeacher_AcademicYearUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SectionHomeroomTeachers_TeacherId_AcademicYearId",
                table: "SectionHomeroomTeachers");

            migrationBuilder.CreateIndex(
                name: "IX_SectionHomeroomTeachers_TeacherId_AcademicYearId",
                table: "SectionHomeroomTeachers",
                columns: new[] { "TeacherId", "AcademicYearId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SectionHomeroomTeachers_TeacherId_AcademicYearId",
                table: "SectionHomeroomTeachers");

            migrationBuilder.CreateIndex(
                name: "IX_SectionHomeroomTeachers_TeacherId_AcademicYearId",
                table: "SectionHomeroomTeachers",
                columns: new[] { "TeacherId", "AcademicYearId" });
        }
    }
}
