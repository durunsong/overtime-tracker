import * as XLSX from "xlsx";

const templateRows = [
  {
    "日期": "2026-05-01",
    "姓名": "张三",
    "上班时间": "09:30",
    "下班时间": "20:30",
    "考勤状态": "正常",
    "备注": "示例：请替换为真实考勤数据",
  },
  {
    "日期": "2026-05-04",
    "姓名": "张三",
    "上班时间": "09:30",
    "下班时间": "19:30",
    "考勤状态": "正常",
    "备注": "",
  },
];

export function createAttendanceImportTemplate(): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(templateRows, {
    header: ["日期", "姓名", "上班时间", "下班时间", "考勤状态", "备注"],
  });

  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "考勤导入模板");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
