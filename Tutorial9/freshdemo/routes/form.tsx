/** @jsx h */
import { h } from "preact";
import { Handlers, PageProps } from "$fresh/server.ts";

interface Data {
  message?: string;
}

export const handler: Handlers<Data> = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const name = formData.get("name")?.toString() || "Anonymous";
    return ctx.render({ message: `Hello, ${name}! Your form was submitted.` });
  },
};

export default function FormPage({ data }: PageProps<Data>) {
  return (
    <div>
      <h1>Form Submission</h1>
      <form method="POST" action="/form">
        <label>
          Name: <input type="text" name="name" />
        </label>
        <button type="submit">Submit</button>
      </form>
      {data?.message && <p>{data.message}</p>}
    </div>
  );
}
