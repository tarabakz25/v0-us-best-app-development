export interface SurveyResultRow {
  question: string | null
  option: string | null
  vote_count: number | null
  total_votes: number | null
}

export interface SurveyResultsState {
  totalResponses: number
  questionResults: Record<
    string,
    {
      totalVotes: number
      options: Record<string, number>
    }
  >
}

export const createEmptySurveyResults = (): SurveyResultsState => ({
  totalResponses: 0,
  questionResults: {},
})

export const transformSurveyResults = (rows: SurveyResultRow[] | null): SurveyResultsState => {
  if (!rows || rows.length === 0) {
    return createEmptySurveyResults()
  }

  const questionResults: SurveyResultsState["questionResults"] = {}
  const totalResponses = rows[0]?.total_votes ?? 0

  rows.forEach((row) => {
    const questionKey = row.question?.trim()
    if (!questionKey) return

    if (!questionResults[questionKey]) {
      questionResults[questionKey] = {
        totalVotes: row.total_votes ?? totalResponses,
        options: {},
      }
    }

    if (row.option) {
      questionResults[questionKey].options[row.option] = Number(row.vote_count ?? 0)
    }
  })

  return {
    totalResponses,
    questionResults,
  }
}
