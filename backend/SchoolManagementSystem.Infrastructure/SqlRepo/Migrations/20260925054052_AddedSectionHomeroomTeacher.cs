using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Migrations
{
    /// <inheritdoc />
    public partial class AddedSectionHomeroomTeacher : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SectionHomeroomTeachers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AcademicYearId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TeacherId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SectionHomeroomTeachers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SectionHomeroomTeachers_AcademicYears_AcademicYearId",
                        column: x => x.AcademicYearId,
                        principalTable: "AcademicYears",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SectionHomeroomTeachers_Sections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "Sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SectionHomeroomTeachers_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SectionHomeroomTeachers_AcademicYearId",
                table: "SectionHomeroomTeachers",
                column: "AcademicYearId");

            migrationBuilder.CreateIndex(
                name: "IX_SectionHomeroomTeachers_SectionId_AcademicYearId",
                table: "SectionHomeroomTeachers",
                columns: new[] { "SectionId", "AcademicYearId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SectionHomeroomTeachers_TeacherId_AcademicYearId",
                table: "SectionHomeroomTeachers",
                columns: new[] { "TeacherId", "AcademicYearId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SectionHomeroomTeachers");
        }
    }
}
