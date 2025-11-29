---
trigger: model_decision
description: Full architecture rules for the Report System V3, PDF renderer, and Supabase pipeline.
---

# PROJECT RULES — REPORT SYSTEM V3

---

## 1. CORE ARCHITECTURE
Allowed models only:
- ReportTemplateV3
- TemplateSectionV3
- ReportV3
- SectionInstanceV3

Rules:
- All report logic must be under /lib/rapport/*
- V1/V2 code is READ-ONLY
- Do not mix versions

New section types must include:
1. Domain interface  
2. Zod schema  
3. DB representation  
4. API mapping  
5. UI form  
6. Renderer module  

---

## 2. PDF RENDERING STANDARDS

Renderer must be:
- modular  
- deterministic  
- stateless  

Modules:
- renderSectionV3  
- renderTextBlock  
- renderImageLayout  

Text spacing:
- H1: 24px  
- H2: 16px  
- Body: 8px  

Image modes allowed:
- grid  
- full  
- stacked  

Full PDF pipeline:
1. Load template  
2. Load section instances  
3. Normalize  
4. Render via modular renderer  
5. Output final PDF buffer  

---

## 3. SUPABASE DEVELOPMENT PIPELINE

Every backend change must follow:
1. SQL migration  
2. Types update  
3. Zod update  
4. Server logic update  
5. API update  
6. UI update (if needed)  
7. RLS validation  
8. Test with real data  

---

# END OF PROJECT RULES
