import { baseApi } from "@/app/base-api";

import type {
    AttendanceSummary,
    MarkAttendanceRequest,
    RosterAttendanceEntry,
    StudentAttendanceRecord
} from "./@types";


export const attendanceApi=baseApi.injectEndpoints({
endpoints:(builder)=>({
         getRosterAttendance:builder.query<RosterAttendanceEntry[],{sectionId:string; academicYearId:string; date:string}>({
            query:({sectionId, academicYearId, date})=>({
                url:`/sections/${sectionId}/academic-years/${academicYearId}/attendance`,
                method:"GET",
                params:{date}
            }),
            providesTags:(_r,_e,{sectionId,academicYearId,date})=>[
                {
                    type:"Attendance",id:`${sectionId}-${academicYearId}-${date}`
                }
            ],
         }),
      markAttendance:builder.mutation<RosterAttendanceEntry[],{sectionId:string;academicYearId:string; data:MarkAttendanceRequest}>({
        query:({sectionId,academicYearId,data})=>({
            url:`/sections/${sectionId}/academic-years/${academicYearId}/attendance`,
            method:"POST",
            data
        }),
        invalidatesTags:(_r,_e,{sectionId,academicYearId,data})=>[
            {
                type:"Attendance",id:`${sectionId}-${academicYearId}-${data.date}`
            }
        ]
    }),

    getStudentAttendance:builder.query<StudentAttendanceRecord[],{studentId:string;from?:string; to?:string}>({
        query:({studentId,from,to})=>({
            url:`/students/${studentId}/attendance`,
            method:"GET",
            params:{from,to}
        }),
        providesTags:(_r,_e,{studentId})=>[
            {
                type:"Attendance",id:`${studentId}`
            }
        ]
    }),
    getStudentAttendanceSummary:builder.query<AttendanceSummary,{studentId:string; from?:string; to?:string}>({
        query:({studentId, from, to})=>({
             url: `/students/${studentId}/attendance/summary`,
        method: "GET",
        params: { from, to },
        }),
        providesTags:(_r,_e,{studentId})=>[
            {
                type:"Attendance",id:`${studentId}-summary`
            }
        ]
    }),
   
    }),
    overrideExisting:false
})


export const {
useGetRosterAttendanceQuery,
useMarkAttendanceMutation,
useGetStudentAttendanceQuery,
useGetStudentAttendanceSummaryQuery
}= attendanceApi