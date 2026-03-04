import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { EncyclopediaCard } from './encyclopedia-card.entity';
import { EncyclopediaContent } from './encyclopedia-content.entity';

@Entity('encyclopedia_card_versions')
export class EncyclopediaCardVersion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'card_id' })
    cardId: number;

    @ManyToOne(() => EncyclopediaCard, (card) => card.versions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'card_id' })
    card: EncyclopediaCard;

    @Column({ name: 'version_string', length: 20 })
    versionString: string;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @OneToMany(() => EncyclopediaContent, (content) => content.version)
    contents: EncyclopediaContent[];
}
