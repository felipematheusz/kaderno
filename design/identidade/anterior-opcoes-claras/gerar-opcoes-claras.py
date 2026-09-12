# Gera as três opções claras (B, D, E) a partir de um único template com tokens %%X%%.
import json

TEMPLATE = r'''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="%%FONTS_LINK%%">
  <style>
    body { margin: 0; background: %%BG%%; color: %%TEXT%%; font-family: %%UI%%; -webkit-font-smoothing: antialiased; }
    a { color: %%LINK%%; } a:hover { color: %%ACCENT_HOVER%%; }
    * { box-sizing: border-box; }
  </style>
</helmet>
<div style="width: 1200px; min-height: 1200px; background: %%BG%%; padding: 44px 48px 40px 48px; display: flex; flex-direction: column; gap: 24px;">

  <!-- Cabeçalho -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 32px;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="%%MARK_R%%" fill="%%MARK_BG%%"></rect><rect x="12" y="14" width="24" height="4" rx="2" fill="%%MARK_FG%%"></rect><rect x="12" y="22" width="24" height="4" rx="2" fill="%%MARK_FG%%"></rect><rect x="12" y="30" width="14" height="4" rx="2" fill="%%MARK_FG%%"></rect></svg>
      <div style="font-family: %%DISPLAY%%; font-weight: %%W_DISPLAY%%; font-size: 30px; letter-spacing: %%DISPLAY_TRACK%%; line-height: 1;">Caderno</div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
      <div style="font-family: %%MONO%%; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: %%TEXT3%%;">%%LABEL%%</div>
      <div style="font-size: 14px; color: %%TEXT2%%; max-width: 560px; text-align: right; line-height: 1.45; text-wrap: pretty;">%%DESC%%</div>
    </div>
  </div>

  <!-- Balanço -->
  <div style="display: flex; flex-direction: column; gap: 22px; padding: 26px 28px; background: %%PANEL%%; border: 1px solid %%PANEL_BORDER%%; border-radius: %%R_PANEL%%; box-shadow: %%PANEL_SHADOW%%; background-image: %%HERO_BG%%;">
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="font-family: %%MONO%%; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: %%TEXT3%%;">Emprestado</div>
        <div style="display: flex; align-items: baseline; gap: 6px;"><span style="font-family: %%DISPLAY%%; font-weight: %%W_DISPLAY_SUB%%; font-size: 16px; color: %%TEXT3%%;">R$</span><span style="font-family: %%DISPLAY%%; font-weight: %%W_DISPLAY%%; font-size: 42px; line-height: 1; letter-spacing: %%DISPLAY_TRACK%%; font-variant-numeric: tabular-nums;">12.400</span><span style="font-family: %%DISPLAY%%; font-weight: %%W_DISPLAY_SUB%%; font-size: 18px; color: %%TEXT2%%;">,00</span></div>
        <div style="font-size: 13px; color: %%TEXT2%%;">em 7 contratos ativos</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="font-family: %%MONO%%; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: %%TEXT3%%;">Recebido</div>
        <div style="display: flex; align-items: baseline; gap: 6px;"><span style="font-family: %%DISPLAY%%; font-weight: %%W_DISPLAY_SUB%%; font-size: 16px; color: %%TEXT3%%;">R$</span><span style="font-family: %%DISPLAY%%; font-weight: %%W_DISPLAY%%; font-size: 42px; line-height: 1; letter-spacing: %%DISPLAY_TRACK%%; font-variant-numeric: tabular-nums; color: %%GREEN%%;">7.180</span><span style="font-family: %%DISPLAY%%; font-weight: %%W_DISPLAY_SUB%%; font-size: 18px; color: %%TEXT2%%;">,00</span></div>
        <div style="font-size: 13px; color: %%TEXT2%%;">R$ 1.240,00 só neste mês</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;"><div style="font-family: %%MONO%%; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: %%TEXT3%%;">A receber</div><span style="display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; border-radius: %%BADGE_R%%; background: %%RED_TINT%%; color: %%RED%%; font-size: 12px; font-weight: 600;"><span style="width: 6px; height: 6px; border-radius: 50%; background: %%RED%%;"></span>1 atrasada</span></div>
        <div style="display: flex; align-items: baseline; gap: 6px;"><span style="font-family: %%DISPLAY%%; font-weight: %%W_DISPLAY_SUB%%; font-size: 16px; color: %%TEXT3%%;">R$</span><span style="font-family: %%DISPLAY%%; font-weight: %%W_DISPLAY%%; font-size: 42px; line-height: 1; letter-spacing: %%DISPLAY_TRACK%%; font-variant-numeric: tabular-nums; color: %%ACCENT_TEXT_ON_LIGHT%%;">6.020</span><span style="font-family: %%DISPLAY%%; font-weight: %%W_DISPLAY_SUB%%; font-size: 18px; color: %%TEXT2%%;">,00</span></div>
        <div style="font-size: 13px; color: %%TEXT2%%;">R$ 800,00 são juros previstos</div>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; height: 12px; gap: 3px;">
        <div style="width: 54.4%; background: %%GREEN%%; border-radius: 6px;"></div>
        <div style="width: 43.9%; background: %%ACCENT%%; border-radius: 6px;"></div>
        <div style="width: 1.7%; min-width: 8px; background: %%RED%%; border-radius: 6px;"></div>
      </div>
      <div style="display: flex; gap: 20px; font-size: 13px; color: %%TEXT2%%;">
        <span style="display: inline-flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; border-radius: 2px; background: %%GREEN%%;"></span>Recebido <span style="font-family: %%MONO%%; color: %%TEXT%%;">R$ 7.180,00</span></span>
        <span style="display: inline-flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; border-radius: 2px; background: %%ACCENT%%;"></span>A vencer <span style="font-family: %%MONO%%; color: %%TEXT%%;">R$ 5.800,00</span></span>
        <span style="display: inline-flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; border-radius: 2px; background: %%RED%%;"></span>Atrasado <span style="font-family: %%MONO%%; color: %%TEXT%%;">R$ 220,00</span></span>
        <span style="margin-left: auto; color: %%TEXT3%%;">O balanço vira uma barra: dá para ver de longe quanto já voltou.</span>
      </div>
    </div>
  </div>

  <!-- Duas colunas -->
  <div style="display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 20px;">
    <div style="display: flex; flex-direction: column; background: %%PANEL%%; border: 1px solid %%PANEL_BORDER%%; border-radius: %%R_PANEL%%; box-shadow: %%PANEL_SHADOW%%; overflow: hidden;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid %%SEP%%;">
        <div style="display: flex; align-items: baseline; gap: 10px;"><div style="font-family: %%DISPLAY%%; font-weight: %%W_TITLE%%; font-size: 17px; letter-spacing: %%DISPLAY_TRACK%%;">Parcelas de hoje</div><div style="font-family: %%MONO%%; font-size: 12px; color: %%TEXT3%%;">2 · R$ 806,67</div></div>
        <a href="#" style="font-size: 13px; font-weight: 600; text-decoration: none;">Ver agenda</a>
      </div>
      <div style="display: flex; align-items: center; gap: 14px; padding: 11px 20px; border-bottom: 1px solid %%SEP%%; background: %%RED_ROW%%;">
        <div style="font-family: %%MONO%%; font-size: 12px; color: %%RED%%; width: 60px;">07/09</div>
        <div style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0;"><div style="font-size: 14px; font-weight: %%W_NAME%%;">Antônio Ferreira</div><div style="font-family: %%MONO%%; font-size: 12px; color: %%RED%%;">#0039 · parcela 2/4 · 4 dias atrasada</div></div>
        <div style="font-family: %%MONO%%; font-size: 14px; font-weight: 500; white-space: nowrap;">R$ 220,00</div>
        <div style="display: flex; gap: 6px; width: 132px; justify-content: flex-end;"><button style="height: 32px; padding: 0 12px; background: %%BTN2_BG%%; color: %%BTN2_TEXT%%; border: 1px solid %%BTN2_BORDER%%; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 13px; font-weight: 500; cursor: pointer;">Cobrar</button><button style="height: 32px; padding: 0 12px; background: %%BTN1_BG%%; color: %%BTN1_TEXT%%; border: none; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 13px; font-weight: 600; cursor: pointer;">Pagar</button></div>
      </div>
      <div style="display: flex; align-items: center; gap: 14px; padding: 11px 20px; border-bottom: 1px solid %%SEP%%;">
        <div style="font-family: %%MONO%%; font-size: 12px; color: %%TEXT3%%; width: 60px;">hoje</div>
        <div style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0;"><div style="font-size: 14px; font-weight: %%W_NAME%%; color: %%TEXT2%%;">Marcos Andrade</div><div style="font-family: %%MONO%%; font-size: 12px; color: %%TEXT3%%;">#0042 · parcela 1/3 · recebida via Pix</div></div>
        <div style="font-family: %%MONO%%; font-size: 14px; font-weight: 500; white-space: nowrap; color: %%TEXT3%%; text-decoration: line-through;">R$ 366,67</div>
        <div style="display: flex; justify-content: flex-end; width: 132px;"><span style="display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: %%BADGE_R%%; background: %%GREEN_TINT%%; color: %%GREEN%%; font-size: 12px; font-weight: 600;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4L19 6"></path></svg>Pago</span></div>
      </div>
      <div style="display: flex; align-items: center; gap: 14px; padding: 11px 20px; border-bottom: 1px solid %%SEP%%;">
        <div style="font-family: %%MONO%%; font-size: 12px; color: %%AMBER%%; width: 60px;">hoje</div>
        <div style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0;"><div style="font-size: 14px; font-weight: %%W_NAME%%;">Juliana Prado</div><div style="font-family: %%MONO%%; font-size: 12px; color: %%TEXT3%%;">#0041 · parcela 3/6</div></div>
        <div style="font-family: %%MONO%%; font-size: 14px; font-weight: 500; white-space: nowrap;">R$ 440,00</div>
        <div style="display: flex; gap: 6px; width: 132px; justify-content: flex-end;"><button style="height: 32px; padding: 0 12px; background: %%BTN2_BG%%; color: %%BTN2_TEXT%%; border: 1px solid %%BTN2_BORDER%%; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 13px; font-weight: 500; cursor: pointer;">Cobrar</button><button style="height: 32px; padding: 0 12px; background: %%BTN1_BG%%; color: %%BTN1_TEXT%%; border: none; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 13px; font-weight: 600; cursor: pointer;">Pagar</button></div>
      </div>
      <div style="display: flex; align-items: center; gap: 14px; padding: 11px 20px;">
        <div style="font-family: %%MONO%%; font-size: 12px; color: %%TEXT3%%; width: 60px;">amanhã</div>
        <div style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0;"><div style="font-size: 14px; font-weight: %%W_NAME%%; color: %%TEXT2%%;">Renata Lima</div><div style="font-family: %%MONO%%; font-size: 12px; color: %%TEXT3%%;">#0038 · venda · parcela 5/8</div></div>
        <div style="font-family: %%MONO%%; font-size: 14px; font-weight: 500; white-space: nowrap; color: %%TEXT2%%;">R$ 400,00</div>
        <div style="display: flex; gap: 6px; width: 132px; justify-content: flex-end;"><button style="height: 32px; padding: 0 12px; background: %%BTN2_BG%%; color: %%BTN2_TEXT%%; border: 1px solid %%BTN2_BORDER%%; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 13px; font-weight: 500; cursor: pointer;">Lembrar</button></div>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; background: %%PANEL%%; border: 1px solid %%PANEL_BORDER%%; border-radius: %%R_PANEL%%; box-shadow: %%PANEL_SHADOW%%; overflow: hidden;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid %%SEP%%;">
        <div style="display: flex; align-items: baseline; gap: 10px;"><div style="font-family: %%DISPLAY%%; font-weight: %%W_TITLE%%; font-size: 17px; letter-spacing: %%DISPLAY_TRACK%%;">Contratos ativos</div><div style="font-family: %%MONO%%; font-size: 12px; color: %%TEXT3%%;">7</div></div>
        <a href="#" style="font-size: 13px; font-weight: 600; text-decoration: none;">Ver todos</a>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 20px; border-bottom: 1px solid %%SEP%%;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;"><div style="font-size: 14px; font-weight: %%W_NAME%%;">Marcos Andrade</div><div style="font-family: %%MONO%%; font-size: 13px; font-weight: 500;">R$ 1.100,00</div></div>
        <div style="display: flex; gap: 4px; height: 8px;"><div style="flex: 1; border-radius: 4px; background: %%SEG_PAID%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_NEXT%%; outline: 1.5px solid %%ACCENT%%; outline-offset: -1.5px;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_TODO%%;"></div></div>
        <div style="font-family: %%MONO%%; font-size: 12px; color: %%TEXT3%%;">#0042 · 1 de 3 pagas · próxima 11/10</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 20px; border-bottom: 1px solid %%SEP%%;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;"><div style="font-size: 14px; font-weight: %%W_NAME%%;">Juliana Prado</div><div style="font-family: %%MONO%%; font-size: 13px; font-weight: 500;">R$ 2.640,00</div></div>
        <div style="display: flex; gap: 4px; height: 8px;"><div style="flex: 1; border-radius: 4px; background: %%SEG_PAID%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_PAID%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_NEXT%%; outline: 1.5px solid %%ACCENT%%; outline-offset: -1.5px;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_TODO%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_TODO%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_TODO%%;"></div></div>
        <div style="font-family: %%MONO%%; font-size: 12px; color: %%TEXT3%%;">#0041 · 2 de 6 pagas · próxima hoje</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 20px; border-bottom: 1px solid %%SEP%%;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;"><div style="font-size: 14px; font-weight: %%W_NAME%%;">Antônio Ferreira</div><div style="font-family: %%MONO%%; font-size: 13px; font-weight: 500;">R$ 880,00</div></div>
        <div style="display: flex; gap: 4px; height: 8px;"><div style="flex: 1; border-radius: 4px; background: %%SEG_PAID%%;"></div><div style="flex: 1; border-radius: 4px; background: %%RED%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_TODO%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_TODO%%;"></div></div>
        <div style="font-family: %%MONO%%; font-size: 12px; color: %%RED%%;">#0039 · 1 de 4 pagas · 2ª atrasada 4 dias</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 20px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;"><div style="font-size: 14px; font-weight: %%W_NAME%%;">Renata Lima <span style="font-weight: 400; color: %%TEXT3%%;">· Notebook Dell</span></div><div style="font-family: %%MONO%%; font-size: 13px; font-weight: 500;">R$ 3.200,00</div></div>
        <div style="display: flex; gap: 4px; height: 8px;"><div style="flex: 1; border-radius: 4px; background: %%SEG_PAID%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_PAID%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_PAID%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_PAID%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_NEXT%%; outline: 1.5px solid %%ACCENT%%; outline-offset: -1.5px;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_TODO%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_TODO%%;"></div><div style="flex: 1; border-radius: 4px; background: %%SEG_TODO%%;"></div></div>
        <div style="font-family: %%MONO%%; font-size: 12px; color: %%TEXT3%%;">#0038 · venda · 4 de 8 pagas · próxima amanhã</div>
      </div>
    </div>
  </div>

  <!-- Componentes -->
  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px;">
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 20px; background: %%PANEL%%; border: 1px solid %%PANEL_BORDER%%; border-radius: %%R_PANEL%%; box-shadow: %%PANEL_SHADOW%%;">
      <div style="font-family: %%MONO%%; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: %%TEXT3%%;">Ações</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
        <button style="height: 42px; padding: 0 18px; background: %%BTN1_BG%%; color: %%BTN1_TEXT%%; border: none; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>Novo contrato</button>
        <button style="height: 42px; padding: 0 16px; background: %%BTN2_BG%%; color: %%BTN2_TEXT%%; border: 1px solid %%BTN2_BORDER%%; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 14px; font-weight: 500; cursor: pointer;">Gerar PDF</button>
        <button style="height: 42px; padding: 0 8px; background: transparent; color: %%LINK%%; border: none; font-family: %%UI%%; font-size: 14px; font-weight: 600; cursor: pointer;">Ver histórico</button>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
        <button style="height: 34px; padding: 0 12px; background: %%BTN2_BG%%; color: %%BTN2_TEXT%%; border: 1px solid %%BTN2_BORDER%%; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 13px; font-weight: 500; cursor: pointer;">Cobrar</button>
        <button style="height: 34px; padding: 0 12px; background: %%BTN2_BG%%; color: %%BTN2_TEXT%%; border: 1px solid %%BTN2_BORDER%%; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 13px; font-weight: 500; cursor: pointer;">Renegociar</button>
        <button style="height: 34px; padding: 0 12px; background: %%BTN1_BG%%; color: %%BTN1_TEXT%%; border: none; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 13px; font-weight: 600; cursor: pointer;">Pagar</button>
        <button style="height: 34px; padding: 0 12px; background: transparent; color: %%RED%%; border: 1px solid %%RED_BORDER%%; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 13px; font-weight: 500; cursor: pointer;">Excluir</button>
      </div>
      <div style="display: flex; gap: 2px; padding: 3px; background: %%SEG_TRACK%%; border: 1px solid %%SEG_TRACK_BORDER%%; border-radius: %%R_CTRL%%;">
        <div style="flex: 1; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: %%TEXT2%%; border-radius: %%R_SEG_IN%%;">Diária</div>
        <div style="flex: 1; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: %%TEXT2%%; border-radius: %%R_SEG_IN%%;">Semanal</div>
        <div style="flex: 1; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: %%TEXT2%%; border-radius: %%R_SEG_IN%%;">Quinzenal</div>
        <div style="flex: 1; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: %%SEG_ACTIVE_TEXT%%; background: %%SEG_ACTIVE_BG%%; border: 1px solid %%SEG_ACTIVE_BORDER%%; box-shadow: %%SEG_ACTIVE_SHADOW%%; border-radius: %%R_SEG_IN%%;">Mensal</div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: %%ELEVATED%%; border-radius: %%R_CTRL%%;">
        <div style="display: flex; flex-direction: column; gap: 2px;"><div style="font-size: 14px; font-weight: 500;">Cobrar juros em atraso</div><div style="font-size: 12px; color: %%TEXT3%%;">2% ao dia sobre a parcela vencida</div></div>
        <div style="width: 44px; height: 26px; border-radius: 13px; background: %%TOGGLE_ON%%; position: relative; flex-shrink: 0;"><div style="position: absolute; top: 3px; left: 21px; width: 20px; height: 20px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 2px rgba(0,0,0,0.2);"></div></div>
      </div>
      <div style="font-size: 12px; color: %%TEXT3%%; line-height: 1.45;">%%NOTE_ACOES%%</div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 14px; padding: 20px; background: %%PANEL%%; border: 1px solid %%PANEL_BORDER%%; border-radius: %%R_PANEL%%; box-shadow: %%PANEL_SHADOW%%;">
      <div style="font-family: %%MONO%%; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: %%TEXT3%%;">Campos</div>
      <div style="display: flex; flex-direction: column; gap: 6px;"><div style="font-size: 13px; font-weight: 500; color: %%TEXT2%%;">Cliente</div><div style="height: 44px; border: 1px solid %%FIELD_BORDER%%; background: %%FIELD_BG%%; border-radius: %%R_CTRL%%; padding: 0 12px; display: flex; align-items: center; gap: 10px; color: %%TEXT3%%; font-size: 14px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4.3-4.3"></path></svg>Buscar por nome ou CPF</div></div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="font-size: 13px; font-weight: 500; color: %%TEXT2%%;">Valor emprestado</div>
        <div style="height: 56px; border: 1.5px solid %%ACCENT%%; background: %%FIELD_BG%%; border-radius: %%R_CTRL%%; padding: 0 14px; display: flex; align-items: center; gap: 8px; box-shadow: 0 0 0 4px %%ACCENT_TINT%%;"><span style="font-family: %%MONO%%; font-size: 13px; color: %%TEXT3%%;">R$</span><span style="font-family: %%MONO%%; font-size: 24px; font-weight: 500;">1.000,00</span></div>
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: %%ACCENT_TINT%%; border-radius: %%R_CTRL%%; font-size: 13px; color: %%ACCENT_TEXT_ON_LIGHT%%;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path></svg><span><strong style="font-weight: 600;">3x de R$ 366,67</strong> · total R$ 1.100,00 · lucro R$ 100,00</span></div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;">
        <div style="display: flex; flex-direction: column; gap: 6px;"><div style="font-size: 13px; font-weight: 500; color: %%TEXT2%%;">Taxa ao mês</div><div style="height: 44px; border: 1px solid %%FIELD_BORDER%%; background: %%FIELD_BG%%; border-radius: %%R_CTRL%%; padding: 0 12px; display: flex; align-items: center; justify-content: space-between;"><span style="font-family: %%MONO%%; font-size: 18px; font-weight: 500;">10</span><span style="font-family: %%MONO%%; font-size: 13px; color: %%TEXT3%%;">%</span></div></div>
        <div style="display: flex; flex-direction: column; gap: 6px;"><div style="font-size: 13px; font-weight: 500; color: %%TEXT2%%;">Primeira parcela</div><div style="height: 44px; border: 1px solid %%RED%%; background: %%FIELD_BG%%; border-radius: %%R_CTRL%%; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; font-family: %%MONO%%; font-size: 14px;"><span>30/02/26</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%%TEXT3%%" stroke-width="1.75" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 10h18M8 3v4M16 3v4"></path></svg></div></div>
      </div>
      <div style="font-size: 12px; color: %%RED%%; margin-top: -8px;">Essa data não existe. Confira o dia e o mês.</div>
      <div style="font-size: 12px; color: %%TEXT3%%; line-height: 1.45;">%%NOTE_CAMPOS%%</div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 14px; padding: 20px; background: %%PANEL%%; border: 1px solid %%PANEL_BORDER%%; border-radius: %%R_PANEL%%; box-shadow: %%PANEL_SHADOW%%;">
      <div style="font-family: %%MONO%%; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: %%TEXT3%%;">Situação e cliente</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <span style="display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: %%BADGE_R%%; background: %%GREEN_TINT%%; color: %%GREEN%%; font-size: 12px; font-weight: 600;"><span style="width: 6px; height: 6px; border-radius: 50%; background: %%GREEN%%;"></span>Em dia</span>
        <span style="display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: %%BADGE_R%%; background: %%AMBER_TINT%%; color: %%AMBER%%; font-size: 12px; font-weight: 600;"><span style="width: 6px; height: 6px; border-radius: 50%; background: %%AMBER%%;"></span>Vence hoje</span>
        <span style="display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: %%BADGE_R%%; background: %%RED_TINT%%; color: %%RED%%; font-size: 12px; font-weight: 600;"><span style="width: 6px; height: 6px; border-radius: 50%; background: %%RED%%;"></span>Atrasado · 4 dias</span>
        <span style="display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: %%BADGE_R%%; background: %%ELEVATED%%; color: %%TEXT2%%; font-size: 12px; font-weight: 600;"><span style="width: 6px; height: 6px; border-radius: 50%; background: %%TEXT3%%;"></span>Quitado</span>
        <span style="display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: %%BADGE_R%%; background: %%ACCENT_TINT%%; color: %%ACCENT_TEXT_ON_LIGHT%%; font-size: 12px; font-weight: 600;"><span style="width: 6px; height: 6px; border-radius: 50%; background: %%ACCENT%%;"></span>Renegociada</span>
      </div>
      <div style="display: flex; align-items: center; gap: 14px; padding: 12px; background: %%ELEVATED%%; border-radius: %%R_CTRL%%;">
        <div style="position: relative; width: 56px; height: 56px; flex-shrink: 0;">
          <svg width="56" height="56" viewBox="0 0 56 56" style="position: absolute; inset: 0; transform: rotate(-90deg);"><circle cx="28" cy="28" r="25" fill="none" stroke="%%RING_TRACK%%" stroke-width="3"></circle><circle cx="28" cy="28" r="25" fill="none" stroke="%%GREEN%%" stroke-width="3" stroke-linecap="round" stroke-dasharray="128.8 157.1"></circle></svg>
          <div style="position: absolute; inset: 8px; border-radius: %%AVATAR_R%%; background: %%PANEL%%; display: flex; align-items: center; justify-content: center; font-family: %%DISPLAY%%; font-weight: %%W_DISPLAY%%; font-size: 14px;">MA</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 3px; flex-grow: 1;"><div style="font-size: 14px; font-weight: %%W_NAME%%;">Marcos Andrade</div><div style="font-size: 12px; color: %%TEXT2%%;">Score <strong style="font-weight: 600; color: %%GREEN%%;">82</strong> · 3 contratos · cliente desde 2025</div></div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="%%TEXT3%%" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 12px; color: %%TEXT3%%;">Prévia da cobrança · lembrete amigável</div>
        <div style="padding: 12px 14px; background: %%BUBBLE_BG%%; border: 1px solid %%BUBBLE_BORDER%%; border-radius: %%R_CTRL%% %%R_CTRL%% %%R_CTRL%% 4px; font-size: 13px; line-height: 1.5; color: %%TEXT%%;">Oi Marcos, tudo bem? Passando para lembrar da parcela <strong style="font-weight: 600;">2/3 de R$ 366,67</strong>, que vence em <strong style="font-weight: 600;">11/10</strong>. Qualquer coisa é só me chamar.</div>
        <div style="display: flex; justify-content: flex-end;"><button style="height: 34px; padding: 0 12px; background: %%BTN1_BG%%; color: %%BTN1_TEXT%%; border: none; border-radius: %%R_BTN%%; font-family: %%UI%%; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3L10 14"></path><path d="M21 3l-7 18-4-7-7-4z"></path></svg>Enviar no WhatsApp</button></div>
      </div>
      <div style="font-size: 12px; color: %%TEXT3%%; line-height: 1.45;">%%NOTE_CLIENTE%%</div>
    </div>
  </div>

  <!-- Motivação -->
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; padding-top: 4px;">
    <div style="font-size: 13px; color: %%TEXT2%%; line-height: 1.5;"><strong style="font-weight: 600; color: %%TEXT%%;">Por quê.</strong> %%MOTIVO%%</div>
    <div style="font-size: 13px; color: %%TEXT2%%; line-height: 1.5;"><strong style="font-weight: 600; color: %%TEXT%%;">Contra.</strong> %%CONTRA%%</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''

GEIST = "family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500"
COMMON = dict(UI="'Geist', system-ui, -apple-system, sans-serif", MONO="'Geist Mono', ui-monospace, Menlo, monospace")

B = dict(COMMON, W_DISPLAY="700", W_DISPLAY_SUB="600", W_TITLE="700", W_NAME="600", HERO_BG="none",
  FONTS_LINK="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&amp;"+GEIST+"&amp;display=swap",
  DISPLAY="'Sora', 'Segoe UI', system-ui, sans-serif", DISPLAY_TRACK="-0.03em",
  BG="#F9FAFC", PANEL="#FFFFFF", ELEVATED="#F3F4F7", BORDER="#DCDEE2", TEXT="#12161F", TEXT2="#5B6170", TEXT3="#8A90A0",
  ACCENT="#6D4BE0", ACCENT_HOVER="#5A3BC4", ACCENT_TINT="rgba(109,75,224,0.10)", ACCENT_TEXT_ON_LIGHT="#5A3BC4", LINK="#5A3BC4",
  GREEN="#1F9D55", GREEN_TINT="rgba(31,157,85,0.12)", AMBER="#B45309", AMBER_TINT="rgba(180,83,9,0.12)",
  RED="#D6403A", RED_TINT="rgba(214,64,58,0.12)", RED_BORDER="rgba(214,64,58,0.4)", RED_ROW="rgba(214,64,58,0.05)",
  R_PANEL="12px", R_CTRL="8px", R_BTN="8px", R_SEG_IN="6px", BADGE_R="999px", AVATAR_R="10px", MARK_R="12", MARK_BG="#6D4BE0", MARK_FG="#FFFFFF",
  PANEL_BORDER="#DCDEE2", PANEL_SHADOW="none", SEP="#ECEEF2",
  FIELD_BG="#FFFFFF", FIELD_BORDER="#C9CCD2",
  SEG_TRACK="#F3F4F7", SEG_TRACK_BORDER="#DCDEE2", SEG_ACTIVE_BG="#FFFFFF", SEG_ACTIVE_TEXT="#12161F", SEG_ACTIVE_BORDER="#DCDEE2", SEG_ACTIVE_SHADOW="0 1px 2px rgba(0,0,0,0.06)",
  BTN1_BG="#6D4BE0", BTN1_TEXT="#FFFFFF", BTN2_BG="#FFFFFF", BTN2_TEXT="#12161F", BTN2_BORDER="#DCDEE2",
  TOGGLE_ON="#6D4BE0", SEG_PAID="#12161F", SEG_NEXT="rgba(109,75,224,0.14)", SEG_TODO="#E6E8EC", RING_TRACK="#E6E8EC",
  BUBBLE_BG="#F3F4F7", BUBBLE_BORDER="#ECEEF2",
  LABEL="Direção B · Violeta", DESC="Fundo claro neutro, violeta como única cor de ação, painéis brancos com borda fina. Sora nos títulos e números, Geist na interface.",
  NOTE_ACOES="Violeta preenchido só na ação principal. Segmentado com o item ativo em branco, como uma peça encaixada.",
  NOTE_CAMPOS="O campo de valor mostra na hora o que aquele número vira: parcela, total e lucro.",
  NOTE_CLIENTE="Anel de score em volta do avatar e prévia da mensagem antes de cobrar.",
  MOTIVO="Moderno sem ser escuro. O violeta diferencia de bancos e do Jurex, e o branco deixa o número respirar.",
  CONTRA="Violeta virou a cor padrão de muito SaaS; a diferença vem dos componentes e da tipografia, não da cor.")

D = dict(COMMON, W_DISPLAY="700", W_DISPLAY_SUB="600", W_TITLE="700", W_NAME="600", HERO_BG="none",
  FONTS_LINK="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&amp;family=Geist+Mono:wght@400;500&amp;display=swap",
  UI="'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  DISPLAY="'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", DISPLAY_TRACK="-0.035em",
  BG="#F5F5F7", PANEL="#FFFFFF", ELEVATED="#F5F5F7", BORDER="rgba(0,0,0,0.08)", TEXT="#1D1D1F", TEXT2="#6E6E73", TEXT3="#86868B",
  ACCENT="#0071E3", ACCENT_HOVER="#0077ED", ACCENT_TINT="rgba(0,113,227,0.10)", ACCENT_TEXT_ON_LIGHT="#0066CC", LINK="#0066CC",
  GREEN="#248A3D", GREEN_TINT="rgba(52,199,89,0.14)", AMBER="#B25000", AMBER_TINT="rgba(255,149,0,0.16)",
  RED="#D70015", RED_TINT="rgba(255,59,48,0.12)", RED_BORDER="rgba(215,0,21,0.35)", RED_ROW="rgba(255,59,48,0.05)",
  R_PANEL="18px", R_CTRL="12px", R_BTN="999px", R_SEG_IN="7px", BADGE_R="999px", AVATAR_R="50%", MARK_R="12", MARK_BG="#1D1D1F", MARK_FG="#FFFFFF",
  PANEL_BORDER="rgba(0,0,0,0)", PANEL_SHADOW="none", SEP="rgba(0,0,0,0.08)",
  FIELD_BG="#F5F5F7", FIELD_BORDER="rgba(0,0,0,0)",
  SEG_TRACK="#E9E9EB", SEG_TRACK_BORDER="rgba(0,0,0,0)", SEG_ACTIVE_BG="#FFFFFF", SEG_ACTIVE_TEXT="#1D1D1F", SEG_ACTIVE_BORDER="rgba(0,0,0,0)", SEG_ACTIVE_SHADOW="0 1px 3px rgba(0,0,0,0.14)",
  BTN1_BG="#1D1D1F", BTN1_TEXT="#FFFFFF", BTN2_BG="#F5F5F7", BTN2_TEXT="#1D1D1F", BTN2_BORDER="rgba(0,0,0,0)",
  TOGGLE_ON="#34C759", SEG_PAID="#1D1D1F", SEG_NEXT="rgba(0,113,227,0.14)", SEG_TODO="#E9E9EB", RING_TRACK="#E9E9EB",
  BUBBLE_BG="#F5F5F7", BUBBLE_BORDER="rgba(0,0,0,0)",
  LABEL="Direção D · Precisão", DESC="No espírito da Apple: cinza muito claro, superfícies brancas sem borda, botão principal preto em pílula, azul só em link e destaque. Figtree faz o papel da SF.",
  NOTE_ACOES="Preto na ação principal, cinza na secundária, azul só em texto. Segmentado com a peça branca deslizante.",
  NOTE_CAMPOS="Campos sem borda, preenchidos com o cinza do fundo. O foco é o único momento em que o azul aparece como contorno.",
  NOTE_CLIENTE="Avatar redondo com anel de score. Balão de mensagem na mesma superfície cinza dos campos.",
  MOTIVO="Refinado e atemporal: a leitura é limpa mesmo com muita informação, e nada compete com o número.",
  CONTRA="Depende de execução perfeita de espaçamento e tipografia; sem isso, vira só cinza. Pouca cor de marca para lembrar.")

E = dict(COMMON, W_DISPLAY="700", W_DISPLAY_SUB="600", W_TITLE="700", W_NAME="600", HERO_BG="none",
  FONTS_LINK="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&amp;"+GEIST+"&amp;display=swap",
  DISPLAY="'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif", DISPLAY_TRACK="-0.02em",
  BG="#FBF8F5", PANEL="#FFFFFF", ELEVATED="#F4EFEA", BORDER="#E7E0D9", TEXT="#1A1512", TEXT2="#6B625B", TEXT3="#9A8F86",
  ACCENT="#F25C3B", ACCENT_HOVER="#D94A2B", ACCENT_TINT="rgba(242,92,59,0.12)", ACCENT_TEXT_ON_LIGHT="#C8421F", LINK="#C8421F",
  GREEN="#2E8B57", GREEN_TINT="rgba(46,139,87,0.12)", AMBER="#B7791F", AMBER_TINT="rgba(183,121,31,0.14)",
  RED="#C81E3C", RED_TINT="rgba(200,30,60,0.10)", RED_BORDER="rgba(200,30,60,0.4)", RED_ROW="rgba(200,30,60,0.05)",
  R_PANEL="20px", R_CTRL="12px", R_BTN="12px", R_SEG_IN="9px", BADGE_R="8px", AVATAR_R="14px", MARK_R="14", MARK_BG="#F25C3B", MARK_FG="#1A1512",
  PANEL_BORDER="#E7E0D9", PANEL_SHADOW="none", SEP="#F0EAE4",
  FIELD_BG="#FFFFFF", FIELD_BORDER="#D2C9C0",
  SEG_TRACK="#F4EFEA", SEG_TRACK_BORDER="rgba(0,0,0,0)", SEG_ACTIVE_BG="#1A1512", SEG_ACTIVE_TEXT="#FFFFFF", SEG_ACTIVE_BORDER="#1A1512", SEG_ACTIVE_SHADOW="none",
  BTN1_BG="#F25C3B", BTN1_TEXT="#1A1512", BTN2_BG="#FFFFFF", BTN2_TEXT="#1A1512", BTN2_BORDER="#E7E0D9",
  TOGGLE_ON="#F25C3B", SEG_PAID="#1A1512", SEG_NEXT="rgba(242,92,59,0.18)", SEG_TODO="#EAE3DC", RING_TRACK="#EAE3DC",
  BUBBLE_BG="#FFF3EF", BUBBLE_BORDER="#F8D9CF",
  LABEL="Direção E · Coral", DESC="Branco quente, coral como cor de ação com texto escuro em cima, cantos grandes e um display com personalidade (Bricolage Grotesque). Quente, humano, longe de banco.",
  NOTE_ACOES="Coral com texto escuro: contraste alto sem parecer alerta. Segmentado com o item ativo preto, como um carimbo.",
  NOTE_CAMPOS="Cantos de 12px e halo coral no foco. A prévia do cálculo usa a tinta do coral, não o preenchimento.",
  NOTE_CLIENTE="Selos quadrados em vez de pílula. Balão de mensagem levemente coral, lembrando conversa.",
  MOTIVO="Tem calor e personalidade: conversa com o lado humano de emprestar para conhecidos, sem cara de fintech.",
  CONTRA="Coral e vermelho de atraso são vizinhos; exige disciplina para o coral ficar só em ação. O display pode cansar em telas densas.")

from direcoes_extra import extras
TODAS = dict(DirecaoB=B, DirecaoD=D, DirecaoE=E); TODAS.update(extras(COMMON, GEIST))
for name, tokens in TODAS.items():
    out = TEMPLATE
    for k, v in tokens.items():
        out = out.replace("%%"+k+"%%", v)
    leftover = [t for t in out.split("%%")[1::2]]
    assert not leftover, f"{name}: tokens sem valor: {sorted(set(leftover))}"
    open(f"{name}.dc.html", "w", encoding="utf-8").write(out)
    print("ok", name, len(out))
