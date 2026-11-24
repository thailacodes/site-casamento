function doGet(event) {
  const token = event && event.parameter ? event.parameter.token : "";

  try {
    const template = HtmlService.createTemplateFromFile("Index");
    template.deadlinePassed = Date.now() >= RSVP_CONFIG.deadline.getTime();
    template.token = token || "";
    template.searchMode = false;
    template.searchError = "";
    template.members = [];
    template.responses = {};
    template.alreadyConfirmed = false;
    template.groupId = "";
    template.groupName = "";

    if (!token) {
      template.searchMode = true;
      return template.evaluate()
        .setTitle("Confirme sua presença | Thaila & Fernando")
        .addMetaTag("viewport", "width=device-width, initial-scale=1");
    }

    const group = getGroupForToken_(token);
    if (!group) {
      template.searchMode = true;
      template.searchError =
        "Não encontramos esse código de convite. Digite seu nome abaixo para localizar sua família.";
      return template.evaluate()
        .setTitle("Confirme sua presença | Thaila & Fernando")
        .addMetaTag("viewport", "width=device-width, initial-scale=1");
    }

    if (group.membros.some((member) => member.nomePendente)) {
      return renderMessage_(
        "Convite em preparação",
        "A lista deste convite está sendo finalizada. Por favor, fale com os noivos.",
      );
    }

    const responses = getGroupResponses_(group.id);
    template.groupId = group.id;
    template.groupName = group.nome;
    template.members = group.membros;
    template.responses = responses;
    template.alreadyConfirmed = group.membros.some(
      (member) => responses[member.id] === "Sim",
    );

    return template.evaluate()
      .setTitle("Confirme sua presença | Thaila & Fernando")
      .addMetaTag("viewport", "width=device-width, initial-scale=1");
  } catch (error) {
    console.error(error);
    return renderMessage_(
      "Não foi possível abrir o RSVP",
      "Tente novamente em alguns instantes ou fale diretamente com os noivos.",
    );
  }
}

function normalizeSearchText_(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function searchInviteGroups(query) {
  const normalizedQuery = normalizeSearchText_(query);
  if (normalizedQuery.length < 2) {
    throw new Error("Digite pelo menos 2 letras do seu nome para buscar.");
  }

  const queryTerms = normalizedQuery.split(" ");
  const matches = [];

  INVITE_GROUPS.forEach((group) => {
    const hasPending = group.membros.some((member) => member.nomePendente);
    if (hasPending) return;

    const memberNames = group.membros.map((m) => m.nome).join(" • ");
    const haystack = normalizeSearchText_(group.nome + " " + memberNames);

    const allTermsMatch = queryTerms.every((term) => haystack.includes(term));
    if (allTermsMatch) {
      const responses = getGroupResponses_(group.id);
      const alreadyConfirmed = group.membros.some(
        (member) => responses[member.id] === "Sim",
      );

      matches.push({
        groupId: group.id,
        groupName: group.nome,
        members: group.membros.map((m) => ({ id: m.id, nome: m.nome })),
        responses: responses,
        alreadyConfirmed: alreadyConfirmed,
      });
    }
  });

  return matches;
}

function saveRsvpByGroup(groupId, answers) {
  if (Date.now() >= RSVP_CONFIG.deadline.getTime()) {
    throw new Error("O prazo para confirmação terminou em 18/12/2026.");
  }

  const group = INVITE_GROUPS.find((item) => item.id === groupId);
  if (!group) {
    throw new Error("Convite não encontrado.");
  }
  if (group.membros.some((member) => member.nomePendente)) {
    throw new Error("A lista deste convite ainda está sendo finalizada.");
  }
  if (!Array.isArray(answers) || answers.length !== group.membros.length) {
    throw new Error("Selecione Sim ou Não para cada pessoa do convite.");
  }

  const expectedIds = new Set(group.membros.map((member) => member.id));
  const seenIds = new Set();
  answers.forEach((answer) => {
    if (
      !answer ||
      !expectedIds.has(answer.id) ||
      seenIds.has(answer.id) ||
      !["Sim", "Não"].includes(answer.response)
    ) {
      throw new Error("Confira as respostas selecionadas e tente novamente.");
    }
    seenIds.add(answer.id);
  });
  if (seenIds.size !== expectedIds.size) {
    throw new Error("Selecione Sim ou Não para cada pessoa do convite.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getResponseSheet_();
    const values = sheet.getDataRange().getValues();
    const rowByGuestId = new Map();
    for (let index = 1; index < values.length; index += 1) {
      if (values[index][0] === group.id) {
        rowByGuestId.set(String(values[index][2]), index + 1);
      }
    }

    const now = new Date();
    answers.forEach((answer) => {
      const member = group.membros.find((item) => item.id === answer.id);
      const row = [
        group.id,
        group.nome,
        member.id,
        member.nome,
        answer.response,
        now,
      ];
      const existingRow = rowByGuestId.get(member.id);
      if (existingRow) {
        sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
      } else {
        sheet.appendRow(row);
      }
    });
  } finally {
    lock.releaseLock();
  }

  const updatedResponses = getGroupResponses_(group.id);
  const alreadyConfirmed = group.membros.some(
    (member) => updatedResponses[member.id] === "Sim",
  );

  return {
    message: "Suas respostas foram registradas com carinho.",
    groupId: group.id,
    groupName: group.nome,
    members: group.membros.map((m) => ({ id: m.id, nome: m.nome })),
    responses: updatedResponses,
    alreadyConfirmed: alreadyConfirmed,
  };
}