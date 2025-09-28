import {
  readTemplateStructureFromJson,
  saveTemplateStructureToJson,
} from "@/modules/playground/lib/path-to-json";
import { templatePaths } from "@/lib/template";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import path from "path";
import fs from "fs";

function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Invalid JSON structure:", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return Response.json("Playground ID is required", { status: 400 });
  }

  const playground = await prisma.playground.findUnique({
    where: { id },
  });

  if (!playground) {
    return Response.json("Playground not found", { status: 404 });
  }

  const templateKey = playground.template as keyof typeof templatePaths;
  const templatePath = templatePaths[templateKey];

  if (!templatePath) {
    return Response.json("Template not found", { status: 404 });
  }

  try {
    const inputPath = path.join(process.cwd(), templatePath);
    const outputFile = path.join(process.cwd(), `output/${templateKey}.json`);
    await saveTemplateStructureToJson(inputPath, outputFile);
    const templateData = await readTemplateStructureFromJson(outputFile);

    if (!validateJsonStructure(templateData.items)) {
      return Response.json("Invalid template structure", { status: 400 });
    }

    await fs.promises.unlink(outputFile);

    return Response.json(
      {
        success: true,
        templateJson: templateData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json("Failed to read template", { status: 500 });
  }
}
