import { Icon } from "@components/icons";
import { Card, CardTitle, CardHeader, CardContent } from "@components/ui";
import { useResumeContext } from "../providers/state-provider";

export default function OptionsView() {
  const { send } = useResumeContext();

  return (
    <section className="flex flex-col items-center justify-center gap-4 h-screen">
      <h1 className="text-xl font-semibold text-foreground text-center">
        How would you like to fill your resume?
      </h1>
      <p className="text-lg font-normal text-muted-foreground text-center">
        Choose a method to get started effortlessly.
      </p>
      <div className="flex flex-col md:flex-row justify-center gap-4 my-14">
        <Card className="flex flex-col gap-4 p-8 w-96 cursor-pointer hover:opacity-80" onClick={() => send({ type: 'SELECT_IMPORT_RESUME' })}>
          <CardHeader className="text-center">
            <Icon type={'Document'} className="size-10 mx-auto" />
            <CardTitle className="text-lg font-semibold">
              Use Existing Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-normal text-muted-foreground text-center">
              Upload and enhance your current resume effortlessly.
            </p>
          </CardContent>
        </Card>
        <Card className="flex flex-col gap-4 p-8 w-96 cursor-pointer hover:opacity-80" onClick={() => send({ type: 'SELECT_MANUAL_INPUT' })}>
          <CardHeader className="text-center">
            <Icon type={'Pencil'} className="size-10 mx-auto" />
            <CardTitle className="text-lg font-semibold">
              Fill Manually
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-normal text-muted-foreground text-center">
              Start from scratch and customize every detail to your preference.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
