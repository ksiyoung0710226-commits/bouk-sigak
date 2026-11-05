import { redirect } from "next/navigation";

// 발달이론은 '아동보육 필수지식' 안의 한 주제로 옮겨졌습니다.
export default function Theory() {
  redirect("/knowledge/theory");
}
