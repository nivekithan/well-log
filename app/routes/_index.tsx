import {
  json,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [
    { title: "Well Logs" },
    {
      name: "description",
      content:
        "Interpratation of porosity and permeability using well log data",
    },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const type = formData.get("type")!;

  if (type === ALL_LOGS.resistivity.value) {
    const rt = parseFloat(formData.get("rt") as string);
    const rw = parseFloat(formData.get("rw") as string);
    const a = parseFloat(formData.get("a") as string);
    const m = parseFloat(formData.get("m") as string);
    const n = parseFloat(formData.get("n") as string);
    const sw = parseFloat(formData.get("sw") as string);

    const porosity = porosityFromResistivityLog({ a, m, n, rt, rw, sw });

    console.log({ porosity });

    return json({ value: porosity.toFixed(3), logType: type });
  } else if (type === ALL_LOGS.neutron.value) {
    const cn = parseFloat(formData.get("cn") as string);
    const cmatrix = parseFloat(formData.get("cmatrix") as string);
    const cfluid = parseFloat(formData.get("cfluid") as string);

    const porosity = porosityFromNeutron({ cfluid, cmatrix, cn });
    console.log({ porosity });

    return json({ value: porosity.toFixed(3), logType: type });
  } else if (type === ALL_LOGS.density.value) {
    const rhob = parseFloat(formData.get("rhob") as string);
    const rhofluid = parseFloat(formData.get("rhofluid") as string);
    const rhomatrix = parseFloat(formData.get("rhomatrix") as string);

    const porosity = porosityFromDensity({ rhob, rhofluid, rhomatrix });
    console.log({ porosity });

    return json({ value: porosity.toFixed(3), logType: type });
  } else if (type === ALL_LOGS.sonic.value) {
    const deltatfluid = parseFloat(formData.get("deltatfluid") as string);
    const deltatmatrix = parseFloat(formData.get("deltatmatrix") as string);
    const deltat = parseFloat(formData.get("deltat") as string);

    const porosity = porosityFromSonic({
      deltatfluid,
      deltatmatrix,
      deltat,
    });
    console.log({ porosity });

    return json({ value: porosity.toFixed(3), logType: type });
  }

  return json(null);
}

function porosityFromResistivityLog({
  a,
  m,
  n,
  rt,
  sw,
  rw,
}: {
  rt: number;
  rw: number;
  a: number;
  m: number;
  n: number;
  sw: number;
}) {
  return Math.pow(a / (rt / (rw * Math.pow(sw, n))), 1 / m);
}

function porosityFromNeutron({
  cn,
  cfluid,
  cmatrix,
}: {
  cn: number;
  cmatrix: number;
  cfluid: number;
}) {
  return (cn - cmatrix) / (cfluid - cmatrix);
}

function porosityFromDensity({
  rhob,
  rhofluid,
  rhomatrix,
}: {
  rhob: number;
  rhomatrix: number;
  rhofluid: number;
}) {
  return (rhomatrix - rhob) / (rhomatrix - rhofluid);
}

function porosityFromSonic({
  deltatfluid,
  deltatmatrix,
  deltat,
}: {
  deltat: number;
  deltatmatrix: number;
  deltatfluid: number;
}) {
  return (deltat - deltatmatrix) / (deltatfluid - deltatmatrix);
}

const ALL_LOGS = {
  resistivity: {
    value: "resistivity",
    display: "Resistivity Log",
    inputs: [
      { name: "rt", display: "True resistivity" },
      { name: "rw", display: "Formation water resistivity" },
      { name: "a", display: "a (Tortuosity Factor)" },
      { name: "m", display: "m (Cementation Exponent)" },
      { name: "n", display: "n (Saturation Exponent)" },
      { name: "sw", display: "Water saturation" },
    ],
  },
  neutron: {
    value: "neutron",
    display: "Neutron Log",
    inputs: [
      { name: "cn", display: "Count rate of formation (Cn)" },
      { name: "cmatrix", display: "Count rate of matrix rocks (Cmatrix)" },
      { name: "cfluid", display: "Count rate of fluid (Cfluid)" },
    ],
  },
  density: {
    value: "density",
    display: "Density Log",
    inputs: [
      { name: "rhob", display: "Bulk density of formation" },
      { name: "rhomatrix", display: "Matrix Density" },
      { name: "rhofluid", display: "Fluid density" },
    ],
  },
  sonic: {
    value: "sonic",
    display: "Sonic Log",
    inputs: [
      { name: "deltat", display: "Transit time" },
      { name: "deltatmatrix", display: "Matrix transit time" },
      { name: "deltatfluid", display: "Fluid Transit time" },
    ],
  },
};

type LogsName = keyof typeof ALL_LOGS;

export default function Index() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="p-8">
      <Tabs defaultValue={ALL_LOGS.resistivity.value}>
        <TabsList>
          {Object.keys(ALL_LOGS).map((_key) => {
            const key: LogsName = _key as LogsName;

            return (
              <TabsTrigger
                key={ALL_LOGS[key].value}
                value={ALL_LOGS[key].value}
              >
                {ALL_LOGS[key].display}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {Object.keys(ALL_LOGS).map((_key) => {
          const key = _key as LogsName;

          return (
            <TabsContent
              value={ALL_LOGS[key].value}
              key={key}
              className="mt-4 grid place-items-center"
            >
              <Form
                className="flex flex-col gap-y-6 min-w-[320px]"
                method="POST"
              >
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {ALL_LOGS[key].display}
                  </h3>
                </div>
                {ALL_LOGS[key].inputs.map(({ display, name }) => {
                  return (
                    <InputField
                      labelValue={display}
                      inputProps={{ name: name }}
                      key={name}
                    />
                  );
                })}
                <Button
                  type="submit"
                  name="type"
                  value={ALL_LOGS[key].value}
                  className="max-w-[320px]"
                >
                  Calculate
                </Button>
                <p>
                  {actionData?.logType === ALL_LOGS[key].value
                    ? `The calculated porosity is: ${actionData?.value}`
                    : null}
                </p>
              </Form>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

export type InputFieldProps = {
  labelValue: string;
  inputProps: React.ComponentProps<typeof Input>;
};
export function InputField({
  labelValue,
  inputProps: { className, ...inputProps },
}: InputFieldProps) {
  return (
    <div>
      <Label className="font-semibold">{labelValue}</Label>
      <Input {...inputProps} className={cn("max-w-[320px]", className)} />
    </div>
  );
}
