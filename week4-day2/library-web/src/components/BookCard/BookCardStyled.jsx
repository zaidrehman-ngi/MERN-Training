import styled from "styled-components";

const Card = styled.article`
  display: flex;
  gap: var(--space-4);
  padding: ${({ $compact }) =>
    $compact ? "var(--space-3)" : "var(--space-4)"};
  border: var(--border-width-card) solid var(--colour-line);
  border-radius: var(--radius-md);
  background-color: var(--colour-surface);
  color: var(--colour-ink);
  font-family: var(--font-body);

  &:hover {
    border-color: var(--colour-accent);
    box-shadow: var(--shadow-card);
  }

  @media (max-width: 37.5rem) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Cover = styled.img`
  width: ${({ $compact }) =>
    $compact ? "var(--book-cover-width-compact)" : "var(--book-cover-width)"};
  height: ${({ $compact }) =>
    $compact ? "var(--book-cover-height-compact)" : "var(--book-cover-height)"};
  flex-shrink: 0;
  object-fit: cover;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
`;

const Title = styled.h3`
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  line-height: var(--leading-tight);
`;

const Detail = styled.p`
  margin: 0;
  color: var(--colour-body);
  font-size: var(--text-sm);
`;

const Status = styled.p`
  margin: var(--space-1) 0;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background-color: ${({ $status }) =>
    ({
      available: "var(--colour-available)",
      out: "var(--colour-out)",
      overdue: "var(--colour-overdue)",
    })[$status] ?? "var(--colour-surface-sunk)"};
  color: ${({ $status }) =>
    ({
      available: "var(--colour-on-available)",
      out: "var(--colour-on-out)",
      overdue: "var(--colour-on-overdue)",
    })[$status] ?? "var(--colour-body)"};
  font-size: var(--text-xs);
  line-height: var(--leading-tight);
`;

const Button = styled.button`
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: var(--border-width-card) solid var(--colour-accent);
  border-radius: var(--radius-sm);
  background-color: var(--colour-accent);
  color: var(--colour-surface);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;

  &:hover {
    background-color: var(--colour-accent-soft);
    color: var(--colour-ink);
  }

  &:focus-visible {
    outline: var(--border-width-card) solid var(--colour-accent);
    outline-offset: var(--space-1);
  }
`;

function BookCardStyled({ book, onSelect, variant = "default" }) {
  const author = book.author ?? "Unknown author";
  const year = book.year ?? "Unknown year";
  const coverUrl = book.coverUrl ?? "/covers/placeholder.jpg";
  const title = book.title ?? "Untitled book";

  const status = ["available", "out", "overdue"].includes(book.status)
    ? book.status
    : "Status unavailable";
  const isCompact = variant === "compact";

  return (
    <Card $compact={isCompact}>
      <Cover $compact={isCompact} src={coverUrl} alt={`${title} cover`} />

      <Content>
        <Title>{title}</Title>

        <Detail>{author}</Detail>

        <Detail>{year}</Detail>

        <Status $status={status}>{status}</Status>

        <Button type="button" onClick={() => onSelect?.(book)}>
          View Book
        </Button>
      </Content>
    </Card>
  );
}

export default BookCardStyled;
