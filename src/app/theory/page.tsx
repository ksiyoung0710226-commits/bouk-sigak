import { redirect } from "next/navigation";

// 발달이론은 '아동보육 필수지식' 페이지로 합쳐졌습니다. 기존 주소는 그쪽으로 보냅니다.
export default function Theory() {
  redirect("/knowledge#theory");
}
